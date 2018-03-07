import * as React from 'react';
import { Menu, Container, Image, Icon } from 'semantic-ui-react';
import {Link} from 'react-router-dom';

class Navbar extends React.Component {

    render() {
        const logo = require('../img/shacl_logo_trans.png');
        return (
            <Menu
                inverted={true}
                size="large"
            >
                <Container>
                    <Menu.Item><Image src={logo} size="mini"/></Menu.Item>
                    <Menu.Item as="a">
                        <Link
                            to="/about"
                            style={{color: 'white'}}
                        > About
                        </Link>
                    </Menu.Item>
                    <Menu.Item as="a">Contact</Menu.Item>
                    <Menu.Item
                        as="a"
                        href="https://github.com/dubious-developments/UnSHACLed"
                        icon={
                            <Icon
                                name="github"
                                inverted={true}
                            />

                        }
                    />
                    <Menu.Item>v0.1</Menu.Item>
                </Container>
            </Menu>
        );
    }
}
export default Navbar;