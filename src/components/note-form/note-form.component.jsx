import React from 'react';
import NoteInput from '../note-input/note-input.component';
import handleAddNote from './note-form.utils';

const NoteForm = ({ notes, note, id}) => (
    <form onSubmit = {() => handleAddNote(notes, note, id)} className="mb3">
          <NoteInput note={note}/>
          <button className="pa2 f4" type="submit">
            Add Note
          </button>
    </form>
)

export default NoteForm;