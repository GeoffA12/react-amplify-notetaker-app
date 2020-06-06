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
import { deleteNote } from "./graphql/mutations";
import { updateNote } from "./graphql/mutations";

class App extends React.Component {
  constructor() {
    super();
    this.state = {
      notes : [],
      note: "",
      id: ""
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
  /*
  1. Set the note state to the value of the item note passed in
  2. Find the id of the note we're updating in notes array state. 
  3. With the given note id of the selected message, 
  */
  handleNoteClick = noteParam => {
    console.log(noteParam);
    const { note, id } = noteParam;
    this.setState({
      note: note,
      id: id
    })
  }

  handleDeleteNote = async noteId => {
    const { notes } = this.state;
    const input = { id: noteId };
    try {
      const result = await API.graphql(graphqlOperation(deleteNote, {input}));
      const deletedNoteId = result.data.deleteNote.id;
      const updatedNotes = notes.filter((note) => note.id !== deletedNoteId);
      this.setState({
        notes: updatedNotes
      });
    } catch(error) {
      console.log(error);
    }
  }

  handleAddNote = async event => {
    event.preventDefault();
    const { notes, note, id } = this.state;
    /* Syntax to create a graphql mutation programatically from our app using AWS amplify API. 
    We need to pass in a reference to the mutation, query, or subscription we want to execute to grapqlOperation.
    We can find the exact syntax of these references using an import statement to import graphql functions pre-written for us
    by Amplify. 
     */
    
    if (id) {
      try {
        // We'll need to pass in the note state to the graphql mutation in order to store the note in our dynamo db table. 
        const result = await API.graphql(graphqlOperation(updateNote, {input : {id: id, note: note}}));
        const matchingNote = notes.find((aNote) => aNote.id === result.data.updateNote.id);
        
        notes[notes.indexOf(matchingNote)] = result.data.updateNote;
        this.setState({
          notes: notes
        })
      } catch(error) {
        console.log("There was an error: "+ error);
      }
    }
    else {
      try {
        // We'll need to pass in the note state to the graphql mutation in order to store the note in our dynamo db table. 
        const result = await API.graphql(graphqlOperation(createNote, {input : {note: note}}));
        const newNote = result.data.createNote;
        const updateNotes = [newNote, ...notes];
        this.setState ({
          notes: updateNotes,
          note: ''
        });
      } catch(error) {
        console.log("There was an error: "+ error.message);
      }
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
                onClick={() => this.handleNoteClick(item)} 
                  className="list pa1 f3"
                >
                  {item.note}
                </li>
                <button onClick={() => this.handleDeleteNote(item.id)} className="bg-transparent bn f4">
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
