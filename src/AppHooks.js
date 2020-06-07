import React, { useState, useEffect } from 'react';
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

const App = () => {

    // The first value that we get back from the useState function is the actual state or data. The second value that we get back from
    // useState() is a function which sets the piece of state identified in the first value of the array. This function alone will setState({})
    // for the inital value declared in the const array. 
    const[id, setId] = useState("");
    // Here we set a piece of state called 'note' to an initial value of empty string. We can then call setNote() to set the state of note and 
    // re-render to UI accordingly
    const[note, setNote] = useState("");
    const[notes, setNotes] = useState([]);

    const getUser = async () => {
        const user = await Auth.currentAuthenticatedUser();
        return user;
    }

    // useEffect() is used for performing side effects with our functional components. We can hook into class lifecycle hooks by using 
    // the useEffect() method. Remember here that useEffect needs to take in a function. useEffect will be executed when there's an update to any 
    // of our pieces of state, meaning that it will trigger on componentDidUpdate() by default. We can avoid this by adding a second argument 
    // to useEffect found at the bottom of the useEffect() declaration clause. 
    useEffect(() => {
        getNotes();
        
        /*
        Common way of adding subscriptions to a component to improve performance and reduce amount of code logic when updating state in response to
        mutations. Initializing the subscribe method in the componentDidMount() lifecycle method makes the most sense here beacause once the component
        has mounted, we'll immediately want to start listening for on create note mutations. 
        */
        let createNoteListener = null;
        let updateNoteListener = null;
        let deleteNoteListener = null;
        getUser().then( user => {
            createNoteListener = API.graphql(graphqlOperation( onCreateNote,
            { owner: user.username })).subscribe({
                // next is a function which allows us to get any data returned from the subscription. When there's note data, we can get it here in the 
                // next function. 
                next: noteData => {
                    const newNote = noteData.value.data.onCreateNote;
                // This is how we set state reliably when we're dealing with previous data in response to an action. 
                // prevNotes here references the previous value of the state with whichever hook the function is attached to. 
                // Therefore, prevNotes in this context will give us access to the previous value of our notes array state. 
                    setNotes(prevNotes => {
                        const oldNotes = prevNotes.filter((note) => note.id !== newNote.id);
                        const updatedNotes = [...oldNotes, newNote];
                        return updatedNotes;
                    });
                setNote('');
                }
            }
        )});
        getUser().then( user => {
            deleteNoteListener = API.graphql(graphqlOperation(onDeleteNote,
                { owner: user.username })).subscribe({
                next: noteData => {
                    const deletedNote = noteData.value.data.onDeleteNote;
                    setNotes(prevNotes => {
                        const newNotes = prevNotes.filter((note) => note.id !== deletedNote.id);
                        return newNotes;
                    })
                }
            });
        });
        getUser().then( user => {
            updateNoteListener = API.graphql(graphqlOperation(onUpdateNote,
                { owner: user.username })).subscribe({
                next: noteData => {
                    const updatedNote = noteData.value.data.onUpdateNote;
                    setNotes(prevNotes => {
                        const targetIndex = prevNotes.findIndex(note => note.id === updatedNote.id);
                        const updatedNotes = [
                            ...prevNotes.slice(0, targetIndex),
                            updatedNote,
                            ...prevNotes.slice(targetIndex + 1)
                        ]
                        return updatedNotes;
                    })
                    setNote('');
                    setId('');
                   
                }
            });
        })
        return () => {
            console.log("Component is unmounting and unsubscribing");
            debugger;

            createNoteListener.unsubscribe();
            deleteNoteListener.unsubscribe();
            updateNoteListener.unsubscribe();
        }
        // This argument will make sure the useEffect clause only executes when our component mounts and unmounts off of the DOM 
    }, []
);

  const getNotes = async () => {
    
    try {
      const results = await API.graphql(graphqlOperation(listNotes));
      // With react hooks we only need to pass in the value with which we want to update the state with. There's no need to pass in an object
      // anymore when updating state. 
      setNotes(results.data.listNotes.items);
    } catch(error) {
      console.log("There was an error: " + error.message);
    }
  }
  
  const handleNoteClick = noteParam => {
    const { note, id } = noteParam;
    setNote(note);
    setId(id);
  }

  const handleDeleteNote = async noteId => {
    const input = { id: noteId };
    try {
      await API.graphql(graphqlOperation(deleteNote, {input}));
      
    } catch(error) {
      console.log(error);
    }
  }

  const handleAddNote = async event => {
    event.preventDefault();
    
    /* Syntax to create a graphql mutation programatically from our app using AWS amplify API. 
    We need to pass in a reference to the mutation, query, or subscription we want to execute to grapqlOperation.
    We can find the exact syntax of these references using an import statement to import graphql functions pre-written for us
    by Amplify. 
     */
    
    if (id) {
      try {
        // We'll need to pass in the note state to the graphql mutation in order to store the note in our dynamo db table. 
        await API.graphql(graphqlOperation(updateNote, {input : {id: id, note: note}}));
        
      } catch(error) {
        console.log("There was an error: "+ error);
      }
    }
    else {
      try {
        // We'll need to pass in the note state to the graphql mutation in order to store the note in our dynamo db table. 
        await API.graphql(graphqlOperation(createNote, {input : {note: note}}));
        
      } catch(error) {
        console.log("There was an error: "+ error.message);
      }
    }
  }

  const handleChangeNote = event => {
    setNote(event.target.value);
  }

  
return (
    <div className="flex flex-column items-center justify-center pa3 bg-washed-red">
    <h1 className="code f2-1">Amplify Notetaker</h1>
    {/* Note form */}
    <form onSubmit = {handleAddNote} className="mb3">
        <input
        type="text"
        placeholder="Write your note"
        onChange={handleChangeNote}
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
            onClick={() => handleNoteClick(item)} 
                className="list pa1 f3"
            >
                {item.note}
            </li>
            <button onClick={() => handleDeleteNote(item.id)} className="bg-transparent bn f4">
            <span>&times;</span>
            </button>
            </div>
        ))
        }
        </div>
    </div>
    );
}

export default withAuthenticator(App, { includeGreetings: 
true});
