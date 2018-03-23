/// <reference path="./Validator.d.ts"/>

import * as Collections from "typescript-collections";
import {Model, ModelData} from "../entities/model";
import {ProcessorTask} from "../entities/taskProcessor";
import {SHACLValidator} from "./SHACLValidator";
import {Validator} from "./Validator";
import {ModelComponent, ModelTaskMetadata} from "../entities/modelTaskMetadata";

export class ValidationService {

    private model: Model;
    private validators: Collections.Dictionary<ModelComponent, Collections.Set<Validator>>;

    constructor(model: Model) {
        this.model = model;
        this.validators = new Collections.Dictionary<ModelComponent, Collections.Set<Validator>>();

        this.registerValidator(new SHACLValidator());

        let self = this;
        model.registerObserver(function(changeBuffer: Collections.Set<ModelComponent>) {
            let tasks = [];
            let relevantValidators = new Collections.Set<Validator>();
            // return a task for every relevant validator
            changeBuffer.forEach(c => {
                let validatorSet;
                if (validatorSet = self.validators.getValue(c)) {
                    validatorSet.forEach(v => {
                        if (!relevantValidators.contains(v)) {
                            tasks.push(ValidationTask.create(v));
                            relevantValidators.add(v);
                        }
                    });
                }
            });
            return tasks;
        });
    }

    public registerValidator(validator: Validator) {
        validator.getTypesForValidation().forEach(c => {
            let relevantSet = this.validators.getValue(c);
            if (!relevantSet) {
                relevantSet = new Collections.Set<Validator>();
            }
            relevantSet.add(validator);
            this.validators.setValue(c, relevantSet);
        });
    }

}

class ValidationTask {
    public static create(validator: Validator): ProcessorTask<ModelData, ModelTaskMetadata> {
        return Model.createTask(
            (data: ModelData) => {
                validator.validate(data);
            },
            validator.getTypesForValidation(),
            [ModelComponent.ValidationReport]);
    }
}