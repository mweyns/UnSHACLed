import * as React from 'react';
import Navbar from '../components/navbarWork';
import SideBar from '../components/Sidebar';
import MxGraph from '../components/MxGraph';
import {Sidebar, Segment, Menu} from 'semantic-ui-react';

class Workspace extends React.Component<any, any> {

    constructor(props: any) {
        super(props);
        this.state = {
            menuVisible: true,
            dragid: null,
            // TODO enable search for this
            templates: [],
            errorLabel: false
        };

        this.callBackNavBar = this.callBackNavBar.bind(this);
        this.idCallback = this.idCallback.bind(this);
        this.templateCallback = this.templateCallback.bind(this);
        this.setLabel = this.setLabel.bind(this);
    }

    callBackNavBar(childData: boolean) {
        this.setState({
            menuVisible: childData
        });
    }

    idCallback(childData: string) {
        this.setState({
            dragid: childData
        });
    }

    /*
      Callback function to set content of template sidebar entry according
      to click events from the mxGraph component, templates is passed to the child
      component Sidebar, which is a sibling component of mxGraph.
     */
    templateCallback(name: string, count: any) {
        this.setState({
            templates: this.state.templates.concat(
                <Menu.Item
                    as="a"
                    content={name}
                    key={name + count}
                    id={name + count}
                />
            )
        });
        console.log("called callback wiht" + name);
    }

    setLabel(val: boolean) {
        this.setState({
            errorLabel: val
        });
    }

    render() {
        const {menuVisible} = this.state;
        const {templates} = this.state;
        const {errorLabel} = this.state;
        return (
            <div id="wrapper" style={{display:'flex', flexDirection:'column', height:'100%'}}>
                <Navbar visible={menuVisible} callback={this.callBackNavBar}/>
                <Sidebar.Pushable style={{flex:1, height:'100%'}}>
                    <SideBar
                        visible={menuVisible}
                        callback={this.idCallback}
                        templates={templates}
                        showLabel={errorLabel}
                    />
                    <Sidebar.Pusher style={{height:'100%'}}>
                        <Segment basic={true} style={{height:'100vh', padding:0}}>
                            <MxGraph callback={this.templateCallback} setLabel={this.setLabel}/>
                        </Segment>
                    </Sidebar.Pusher>
                </Sidebar.Pushable>
            </div>
        );
    }
}

export default Workspace;
