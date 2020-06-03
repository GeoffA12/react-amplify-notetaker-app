import React from 'react';
/*
Package from aws-amplify-react providing us user authentication out of the box. withAuthenticator is a higher-order
component that will detect our users authentication state (signed-in or not?) and automatically update the UI 
accordingly.
*/
import { withAuthenticator } from "aws-amplify-react";

class App extends React.Component {
  render() {
    return (
      <div>
        Hello World
      </div>
    );
  }
}

export default withAuthenticator(App);
