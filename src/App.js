import React from 'react';
/*
Package from aws-amplify-react providing us user authentication out of the box. withAuthenticator is a higher-order
component that will detect our users authentication state (signed-in or not?) and automatically update the UI 
accordingly.
*/
import { withAuthenticator } from "aws-amplify-react";
import { API, graphqlOperation, Auth } from "aws-amplify";
import { createNote } from "./graphql/mutations";
import { listNotes } from "./graphql/queries";
import { deleteNote } from "./graphql/mutations";
import { updateNote } from "./graphql/mutations";
import { onCreateNote } from "./graphql/subscriptions";
import { onDeleteNote } from "./graphql/subscriptions";
import { onUpdateNote } from "./graphql/subscriptions";

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
    this.getNotes();
    
    /*
    Common way of adding subscriptions to a component to improve performance and reduce amount of code logic when updating state in response to
    mutations. Initializing the subscribe method in the componentDidMount() lifecycle method makes the most sense here beacause once the component
    has mounted, we'll immediately want to start listening for on create note mutations. 
    */
    this.createNotesListener = await API.graphql(graphqlOperation(onCreateNote,
      { owner: (await Auth.currentAuthenticatedUser()).username })).subscribe({
      // next is a function which allows us to get any data returned from the subscription. When there's note data, we can get it here in the 
      // next function. 
      next: noteData => {
        console.log(noteData);
        const newNote = noteData.value.data.onCreateNote;
        const prevNotes= this.state.notes.filter(note => note.id !== newNote.id);
        const updatedNotes = [...prevNotes, newNote];
        this.setState ({
          notes: updatedNotes
        });
      }
    });
    this.deleteNoteListener = await API.graphql(graphqlOperation(onDeleteNote,
      { owner: (await Auth.currentAuthenticatedUser()).username })).subscribe({
      next: noteData => {
        const deletedNote = noteData.value.data.onDeleteNote;
        const updatedNotes = this.state.notes.filter((note) => note.id !== deletedNote.id);
        this.setState({
          notes: updatedNotes
        });
      }
    });
    this.updateNoteListener = await API.graphql(graphqlOperation(onUpdateNote,
      { owner: (await Auth.currentAuthenticatedUser()).username })).subscribe({
      next: noteData => {
        const updatedNote = noteData.value.data.onUpdateNote;
        const targetIndex = this.state.notes.findIndex(note => note.id === updatedNote.id);
        const updatedNotes = [
          ...this.state.notes.slice(0, targetIndex),
          updatedNote,
          ...this.state.notes.slice(targetIndex + 1)
        ]
        this.setState({
          notes: updatedNotes,
          note: "",
          id: ""
        })
      }
    })
  }

  // Remove the subscription using the reference to the graphql subscription we initialized in componentDidMount() to avoid memory leaks
  componentWillUnmount() {
    this.createNotesListener.unsubscribe();
    this.deleteNoteListener.unsubscribe();
    this.updateNoteListener.unsubscribe();
  }

  getNotes = async () => {
    
    try {
      const results = await API.graphql(graphqlOperation(listNotes));
      this.setState({ notes : results.data.listNotes.items});
    } catch(error) {
      console.log("There was an error: " + error.message);
    }
  }
  
  handleNoteClick = noteParam => {
    console.log(noteParam);
    const { note, id } = noteParam;
    this.setState({
      note: note,
      id: id
    })
  }

  handleDeleteNote = async noteId => {
    const input = { id: noteId };
    try {
      await API.graphql(graphqlOperation(deleteNote, {input}));
      
    } catch(error) {
      console.log(error);
    }
  }

  handleAddNote = async event => {
    event.preventDefault();
    const { note, id } = this.state;
    /* Syntax to create a graphql mutation programatically from our app using AWS amplify API. 
    We need to pass in a reference to the mutation, query, or subscription we want to execute to grapqlOperation.
    We can find the exact syntax of these references using an import statement to import graphql functions pre-written for us
    by Amplify. 
     */
    
    if (id) {
      try {
        // We'll need to pass in the note state to the graphql mutation in order to store the note in our dynamo db table. 
        await API.graphql(graphqlOperation(updateNote, {input : {id: id, note: note}}));
        
        //const updatedNote = result.data.updateNote;
      } catch(error) {
        console.log("There was an error: "+ error);
      }
    }
    else {
      try {
        // We'll need to pass in the note state to the graphql mutation in order to store the note in our dynamo db table. 
        await API.graphql(graphqlOperation(createNote, {input : {note: note}}));
        this.setState ({
          
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
    const { notes, note, id } = this.state;
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
            {id ? "Update note" : "Add note"}
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
