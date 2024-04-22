import { createSlice } from "@reduxjs/toolkit";

const initialState = [];

export const StorySlice = createSlice({

    name: "status",
    initialState,
    reducers: {
        statusData: (state, action) => {
            const { id, name, image, photoUrl, time, uid, visible, overlay, displayName } = action.payload;
            // Check if an item with the same id exists in the state
            const existingItemIndex = state.findIndex(item => item.id === id);
            if (existingItemIndex === -1) {
                // If id doesn't exist, add the new item to state
                state.push({ id, name, image, photoUrl, time, uid, visible, overlay, displayName });
            } else {
                // If id already exists, update the existing item
                state[existingItemIndex] = { id, name, image, photoUrl, time, uid, visible, overlay, displayName };
            }
        },
        statusDataClear: (state, action) => {
            return initialState; // Clear the state by returning the initial state
        },
    }

})


export const { statusData, statusDataClear } = StorySlice.actions;

export default StorySlice.reducer;