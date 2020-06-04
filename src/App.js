import React from 'react';
/*
Package from aws-amplify-react providing us user authentication out of the box. withAuthenticator is a higher-order
component that will detect our users authentication state (signed-in or not?) and automatically update the UI 
accordingly.
*/
import { withAuthenticator } from "aws-amplify-react";
import { API, graphqlOperation } from "aws-amplify";
import { createNote } from "./graphql/mutations";
import { listNotes } from "./graphql/queries";

class App extends React.Component {
  constructor() {
    super();
    this.state = {
      notes : [],
      note: ""
    }
  }

  async componentDidMount() {
    try {
      const results = await API.graphql(graphqlOperation(listNotes));
      this.setState({ notes : results.data.listNotes.items});
    } catch(error) {
      console.log("There was an error: " + error.message);
    }

  }

  handleAddNote = async event => {
    event.preventDefault();
    const { notes, note }  = this.state;
    /* Syntax to create a graphql mutation programatically from our app using AWS amplify API. 
    We need to pass in a reference to the mutation, query, or subscription we want to execute to grapqlOperation.
    We can find the exact syntax of these references using an import statement to import graphql functions pre-written for us
    by Amplify. 
     */
    const input = {note : note};
    try {
      // We'll need to pass in the note state to the graphql mutation in order to store the note in our dynamo db table. 
      const result = await API.graphql(graphqlOperation(createNote, { input: input}));
      const newNote = result.data.createNote;
      const updateNotes = [newNote, ...notes];
      this.setState (state => ({
        notes: updateNotes,
        note: ''
      }))
    } catch(error) {
      console.log("There was an error: "+ error.message);
    }
  }
  handleChangeNote = event => {
    this.setState({
      note : event.target.value
    })
  }
  render() {
    const { notes, note } = this.state;
    return (
      <div className="flex flex-column items-center justify-center pa3 bg-washed-red">
        <h1 className="code f2-1">Amplify Notetaker</h1>
        {/* Note form */}
        <form onSubmit = {this.handleAddNote} className="mb3">
          <input
          type="text"
          placeholder="Write your note"
          onChange={this.handleChangeNote}
          value={note}
          />
          <button className="pa2 f4" type="submit">
            Add Note
          </button>
        </form>
        {/* Notes list */}
        <div>
          {
            notes.map(item => (
              <div key={item.id} className="flex items-center">
                <li 
                  className="list pa1 f3"
                >
                  {item.note}
                </li>
                <button className="bg-transparent bn f4">
                <span>&times;</span>
                </button>
              </div>
            ))
          }
        </div>
      </div>
    );
  }
}

export default withAuthenticator(App, { includeGreetings: 
true});
