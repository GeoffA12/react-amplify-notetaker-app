handleAddNote = async (event, note, notes, id) => {
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
export default handleAddNote;