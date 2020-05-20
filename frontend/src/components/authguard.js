import React from 'react'
import { BrowserRouter as Router, Route, Switch, Redirect} from "react-router-dom";
import axios from 'axios';
import socketIOClient from "socket.io-client";

import Login from "./login"
import Home from "./home"

var dragging = 0
var dragZone;
 
export default class AuthGuard extends React.Component {
    constructor(props) {
        super(props);
        this.state = { 
            authorized: false,
            loading: true,
            admin: false
        };
    }

    async OAuth2_0() {
        // Validate token
        const token = localStorage.getItem("token")
        const obj = {
            token: token
        }
        if (token)
        axios.post(window.API_URL+'/user/token', obj)
        .then(res => {
            if (res.data === false) {
                localStorage.clear()
                this.setState({
                    // Authorize user
                    authorized: false,
                    loading: false
                })
            }
            else this.setState({
                // Authorize user
                authorized: true,
                loading: false,
                admin: res.data.admin ? true : false
            })
            // Cache user data received from OAuth2.0 server
            // localStorage.setItem("userCache", JSON.stringify(res.data))
        })
        else this.setState({
            authorized: false,
            loading: false
        })
    }

    serverLocation() {
        const country = localStorage.getItem('server')
        if (country === 'ID') {
            window.API_URL = process.env.REACT_APP_ID_RESTFUL_URL;
            window.SOCKET = socketIOClient(process.env.REACT_APP_ID_SOCKET_URL)
        }
        else if (country === 'US') {
            window.API_URL = process.env.REACT_APP_US_RESTFUL_URL;
            window.SOCKET = socketIOClient(process.env.REACT_APP_US_SOCKET_URL)
        }
        if (country === null) {
            window.API_URL = process.env.REACT_APP_ID_RESTFUL_URL;
            console.log(process.env)
        }
    }
    
    async componentDidMount() {
        await this.serverLocation()
        this.OAuth2_0()
        window.addEventListener('unhandledrejection', this.OAuth2_0.bind(this));

        window.addEventListener("dragenter", function(e) {
            dragZone = document.getElementById('dragZone')
            dragging++;
            if (dragZone) dragZone.style.display = 'block'
            if (e.target.id !== 'dragZone') {
              e.preventDefault();
              e.dataTransfer.effectAllowed = "none";
              e.dataTransfer.dropEffect = "none";
            }
        }, false);
        
        window.addEventListener("dragover", function(e) {
            e.preventDefault();
            if (e.target.id !== 'dragZone') {
                e.dataTransfer.effectAllowed = "none";
                e.dataTransfer.dropEffect = "none";
            }
        }, false);
        
        window.addEventListener("dragleave", function(e) {
            dragging--;
            if (dragging === 0) if (dragZone) dragZone.style.display = 'none'
            if (e.target.id !== 'dragZone') {
                e.preventDefault();
                e.dataTransfer.effectAllowed = "none";
                e.dataTransfer.dropEffect = "none";
            }
        }, false);

        window.addEventListener("drop", (e) => {
            dragging--;
            if (dragging === 0) if (dragZone) dragZone.style.display = 'none'
            if (e.target.id !== 'dragZone') {
                e.preventDefault();
                e.dataTransfer.effectAllowed = "none";
                e.dataTransfer.dropEffect = "none";
            }
        }, false);
    }
    
    componentWillUnmount() {
        window.SOCKET.disconnect()
        window.removeEventListener('unhandledrejection', this.OAuth2_0)
    }
    
    render() {
        return (
            <Router>
                <Switch>
                    <Route path="/login" component={Login} />
                    {this.state.loading
                    ? null : this.state.authorized
                    ? <Route path="/" render={(props) => <Home admin={this.state.admin} {...props} /> }/>
                    : <Redirect push to='/login' />}
                </Switch>
            </Router>
        )
    }
}