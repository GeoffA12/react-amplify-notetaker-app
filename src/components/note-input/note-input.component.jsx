import React from 'react';

const NoteInput = ({ note }) => (
    <input
        type="text"
        placeholder="Write your note"
        onChange={this.handleChangeNote}
        value={note}
    />
);

export default NoteInput;