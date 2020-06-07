import React from 'react';
import ReactDOM from 'react-dom';
import App from './AppHooks';
import * as serviceWorker from './serviceWorker';
/*
Amplify configuiration and setup with React (after installing aws-amplify and aws-amplify-react)
*/
import Amplify from "aws-amplify";
import aws_exports from "./aws-exports";
// As of amplify v4, default stylesheets aren't rendered to the browser via withAuthenticator, so we need to import 
import '@aws-amplify/ui/dist/style.css';
Amplify.configure(aws_exports);

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
