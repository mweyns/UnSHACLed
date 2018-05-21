import * as React from 'react';
import {Dropdown} from 'semantic-ui-react';
import {Link} from "react-router-dom";
import {connect} from 'react-redux';
import UserModal from '../modals/UserModal';
import {DataAccessProvider} from "../persistence/dataAccessProvider";

/*
    Component used to create a dropdown component for an authenticated user

 */
class DropdownUser extends React.Component<any, any> {

    constructor(props: any) {
        super(props);
        this.state = {
            infoVisible: false
        };
        this.closeModalCallback = this.closeModalCallback.bind(this);
        this.showUserModal = this.showUserModal.bind(this);
        this.stopPollingService = this.stopPollingService.bind(this);

    }

    showUserModal() {
        this.setState({
            infoVisible: true
        });
    }

    closeModalCallback(data: any) {
        this.setState({
            infoVisible: false
        });
    }

    /**
     * Method that will invoke the backedn and stop all polling services
     * @return: none
     */
    stopPollingService() {
        let remotefileDAO = DataAccessProvider.getInstance().getRemoteFileDAO();
        remotefileDAO.stop();
    }

    render() {
        let {infoVisible} = this.state;
        console.log(this.props);
        return (
            <div>
                <Dropdown text={this.props.name} pointing="top right">
                    <Dropdown.Menu>
                        <Dropdown.Item>
                            Signed in as <b> {this.props.login} </b>
                        </Dropdown.Item>
                        <Dropdown.Item text='My Profile' onClick={this.showUserModal}/>
                        <Dropdown.Item as={Link} to="/login" onClick={this.stopPollingService}>
                            Sign out
                        </Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
                {infoVisible ?
                    <UserModal visible={infoVisible} login={this.props.login} onClose_cb={this.closeModalCallback}/>
                    : null
                }

            </div>
        );
    }
}

const mapStateToProps = (state) => ({
    name: state.name,
    login: state.login
});

export default connect(mapStateToProps)(DropdownUser);