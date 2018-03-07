import React from 'react';
import { Switch, Route } from 'react-router-dom';
import Login from "../pages/Login";
import Home from "../pages/Home";
import Work from "../pages/Work";
import About from "../pages/About";

class Routes extends React.Component<any, any> {
    render() {
        return (
            <div>
                <Switch>
                    <Route exact={true} path="/" component={Home}/>
                    <Route exact={true} path="/login" component={Login}/>
                    <Route exact={true} path="/user" component={Work}/>
                    <Route exact={true} path="/about" component={About}/>
                </Switch>
            </div>
        );
    }
}

export default Routes;