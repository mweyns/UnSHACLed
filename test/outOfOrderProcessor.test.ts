import { OutOfOrderProcessor } from "../src/entities/outOfOrderProcessor";
import { TaskQueue } from "../src/entities/taskQueue";
import { ModelTaskMetadata, ModelComponent } from "../src/entities/modelTaskMetadata";
import { ModelData, Model } from "../src/entities/model";
import { Task } from "../src/entities/task";
import { PriorityGenerator } from "../src/entities/priorityPartitionedQueue";
import { TaskProcessor } from "../src/entities/taskProcessor";
import { SimpleTaskRewriter } from "../src/entities/taskRewriter";
import { ModelTask } from "../src/entities/taskInstruction";
import { Component } from "../src/persistence/component";

function processNonEmpty<TData, TMetadata>(
    queue: TaskProcessor<TData, TMetadata>): void {

    expect(queue.processTask()).toEqual(true);
}

describe("OutOfOrderProcessor Class", () => {
    it("can be created", () => {
        new OutOfOrderProcessor(new ModelData());
    });

    it("is initially empty", () => {
        let queue = new OutOfOrderProcessor(new ModelData());
        expect(queue.isEmpty()).toEqual(true);
        expect(queue.processTask()).toEqual(false);
    });

    it("supports scheduling tasks", () => {
        let queue = new OutOfOrderProcessor(new ModelData());
        queue.schedule(
            Model.createTask(
                (data: ModelData) => { },
                [ModelComponent.DataGraph],
                [ModelComponent.DataGraph]));
        expect(queue.isEmpty()).toEqual(false);
    });

    it("supports processing tasks", () => {
        let count = 0;
        let queue = new OutOfOrderProcessor(new ModelData());
        queue.schedule(
            Model.createTask(
                (data: ModelData) => { count++; },
                [ModelComponent.DataGraph],
                [ModelComponent.DataGraph]));
        expect(queue.isEmpty()).toEqual(false);
        processNonEmpty(queue);
        expect(queue.isEmpty()).toEqual(true);
        expect(count).toEqual(1);
    });

    it("supports processing dependent tasks", () => {
        let count = 0;
        let queue = new OutOfOrderProcessor(new ModelData());
        queue.schedule(
            Model.createTask(
                (data: ModelData) => { count++; },
                [ModelComponent.DataGraph],
                [ModelComponent.DataGraph]));
        queue.schedule(
            Model.createTask(
                (data: ModelData) => { count++; },
                [ModelComponent.DataGraph],
                [ModelComponent.DataGraph]));
        expect(queue.isEmpty()).toEqual(false);
        processNonEmpty(queue);
        processNonEmpty(queue);
        expect(queue.isEmpty()).toEqual(true);
        expect(count).toEqual(2);
    });

    it("correctly prioritizes tasks", () => {
        let count = 0;
        let queue = new OutOfOrderProcessor(new ModelData());
        queue.schedule(
            Model.createTask(
                (data: ModelData) => { if (count === 0) { count = 1; } },
                [],
                [ModelComponent.DataGraph],
                0));
        queue.schedule(
            Model.createTask(
                (data: ModelData) => { if (count === 2) { count = 3; } },
                [ModelComponent.DataGraph],
                [],
                1));
        queue.schedule(
            Model.createTask(
                (data: ModelData) => { if (count === 1) { count = 2; } },
                [ModelComponent.DataGraph],
                [],
                2));
        expect(queue.isEmpty()).toEqual(false);
        processNonEmpty(queue);
        processNonEmpty(queue);
        processNonEmpty(queue);
        expect(queue.isEmpty()).toEqual(true);
        expect(count).toEqual(3);
    });

    it("updates data in correct order", () => {
        let modelData = new ModelData();
        let queue = new OutOfOrderProcessor(modelData);
        queue.schedule(
            Model.createTask(
                (data: ModelData) => { data.setComponent<number>(ModelComponent.DataGraph, 1); },
                [],
                [ModelComponent.DataGraph]));
        queue.schedule(
            Model.createTask(
                (data: ModelData) => { data.setComponent<number>(ModelComponent.DataGraph, 2); },
                [],
                [ModelComponent.DataGraph],
                1));

        expect(queue.isEmpty()).toEqual(false);
        processNonEmpty(queue);
        processNonEmpty(queue);
        expect(queue.isEmpty()).toEqual(true);
        expect(<number> modelData.getComponent<number>(ModelComponent.DataGraph)).toEqual(2);
    });

    it("transfers output correctly", () => {
        let modelData = new ModelData();
        let queue = new OutOfOrderProcessor(modelData);

        // The following should happen during this test:
        //
        //   1. Task #2 runs and copies its IO output to task #3's data.
        //   2. Task #1 runs and copies *just its data graph output* to task #3's data.
        //   3. Task #3 runs.

        let counter = 0;

        queue.schedule(
            Model.createTask(
                (data: ModelData) => {
                    data.setComponent<number>(ModelComponent.DataGraph, 1);
                    data.setComponent<number>(ModelComponent.IO, 1);
                    expect(counter).toEqual(1);
                    counter++;
                },
                [],
                [ModelComponent.DataGraph,
                ModelComponent.IO]));
        queue.schedule(
            Model.createTask(
                (data: ModelData) => {
                    data.setComponent<number>(ModelComponent.IO, 2);
                    expect(counter).toEqual(0);
                    counter++;
                },
                [],
                [ModelComponent.IO],
                1));
        queue.schedule(
            Model.createTask(
                (data: ModelData) => {
                    expect(data.getComponent<number>(ModelComponent.DataGraph)).toEqual(1);
                    expect(data.getComponent<number>(ModelComponent.IO)).toEqual(2);
                    expect(counter).toEqual(2);
                    counter++;
                },
                [ModelComponent.DataGraph,
                ModelComponent.IO],
                []));

        queue.processAllTasks();
    });

    it("merges instructions", () => {
        let modelData = new ModelData();
        let queue = new OutOfOrderProcessor(modelData);

        // Create a trivial task rewriter.
        let rewriter = new SimpleTaskRewriter<ModelTask>(
            task => true,
            (first, second) => Model.createTask(
                data => { first.execute(data); second.execute(data); },
                [ModelComponent.DataGraph],
                [ModelComponent.DataGraph]));

        // Register it.
        queue.registerRewriter(rewriter);

        // Create a triple of tasks.
        let task1 = Model.createTask(
            (data: ModelData) => {
                data.setComponent<number>(
                    ModelComponent.DataGraph,
                    1 + data.getOrCreateComponent<number>(
                        ModelComponent.DataGraph,
                        () => 0));
            },
            [ModelComponent.DataGraph],
            [ModelComponent.DataGraph]);

        let task2 = task1.clone();
        let task3 = task1.clone();

        // Schedule the tasks.
        queue.schedule(task1);
        queue.schedule(task2);
        queue.schedule(task3);

        // Process a task and rewriter should kick in here.
        processNonEmpty(queue);

        // Task queue will be empty if the rewriter did its job.
        expect(queue.isEmpty()).toEqual(true);
        expect(modelData.getComponent<number>(ModelComponent.DataGraph)).toEqual(3);
    });

    it("feeds output to subsequent tasks", () => {
        let modelData = new ModelData();
        let queue = new OutOfOrderProcessor(modelData);

        queue.schedule(
            Model.createTask(
                data => {
                    let component = data.getOrCreateComponent(
                        ModelComponent.DataGraph,
                        () => new Component<string>());
                    component = component.withPart("key", "Oh hi Mark");
                    data.setComponent(ModelComponent.DataGraph, component);
                },
                [ModelComponent.DataGraph],
                [ModelComponent.DataGraph]));

        queue.schedule(
            Model.createTask(
                data => {
                    expect(data.getComponent<Component<string>>(ModelComponent.DataGraph)).toBeTruthy();
                },
                [ModelComponent.DataGraph],
                []));

        queue.processAllTasks();
    });

    it("to update the architecture state", () => {
        let modelData = new ModelData();
        let queue = new OutOfOrderProcessor(modelData);

        queue.schedule(
            Model.createTask(
                data => {
                    let component = data.getOrCreateComponent(
                        ModelComponent.DataGraph,
                        () => new Component<string>());
                    component = component.withPart("key", "Oh hi Mark");
                    data.setComponent(ModelComponent.DataGraph, component);
                },
                [ModelComponent.DataGraph],
                [ModelComponent.DataGraph]));

        queue.processAllTasks();

        queue.schedule(
            Model.createTask(
                data => {
                    expect(data.getComponent<Component<string>>(ModelComponent.DataGraph)).toBeTruthy();
                },
                [ModelComponent.DataGraph],
                []));

        queue.processAllTasks();
    });
});

describe("PriorityGenerator Class", () => {
    it("generates all-zeros by default", () => {
        let gen = new PriorityGenerator();
        for (let i = 0; i < 10; i++) {
            expect(gen.next()).toEqual(0);
        }
    });

    it("understands no-op notifications", () => {
        let gen = new PriorityGenerator();
        gen.notifyPriorityExists(0);
        for (let i = 0; i < 10; i++) {
            expect(gen.next()).toEqual(0);
        }
    });

    it("generates the right sequence between -2 and 3", () => {
        let gen = new PriorityGenerator();

        let expectation = [
            // One cycle.
            3,
            3, 2,
            3, 2, 1,
            3, 2, 1, 0,
            3, 2, 1, 0, -1,
            3, 2, 1, 0, -1, -2,
            // Once more, with feeling.
            3,
            3, 2,
            3, 2, 1,
            3, 2, 1, 0,
            3, 2, 1, 0, -1,
            3, 2, 1, 0, -1, -2
        ];

        gen.notifyPriorityExists(3);
        gen.notifyPriorityExists(-2);

        for (let i = 0; i < expectation.length; i++) {
            expect(gen.next()).toEqual(expectation[i]);
        }
    });
});