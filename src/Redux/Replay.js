import { createSlice } from "@reduxjs/toolkit";

const initialState = [];

export const Replay = createSlice({

    name: "status",
    initialState,
    reducers: {
        handleRplayData: (state, action) => {
            const { id, message, photoUrl, videoUrl, emojiUrl, name } = action.payload;
            // Check if an item with the same id exists in the state
            const existingItemIndex = state.findIndex(item => item.id === id);
            if (existingItemIndex === -1) {
                // If id doesn't exist, add the new item to state
                state.push({ id, message, photoUrl, videoUrl, emojiUrl, name });
            } else {
                // If id already exists, update the existing item
                state[existingItemIndex] = { id, message, photoUrl, videoUrl, emojiUrl, name };
            }
        },
        handleRplayDataClear: (state, action) => {
            return initialState; // Clear the state by returning the initial state
        },
    }

})


export const { handleRplayData, handleRplayDataClear } = Replay.actions;

export default Replay.reducer;