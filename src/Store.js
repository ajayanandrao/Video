
import { configureStore } from "@reduxjs/toolkit";
import counterReducer from "./Redux/CounterSlice";
import statusReducer from "./Redux/StorySlice";
import ReplayReducer from "./Redux/Replay";
import PrivateReducer from "./Redux/PrivatePass";


export const Store = configureStore({
    reducer: {
        counter: counterReducer,
        status: statusReducer,
        replay: ReplayReducer,
        private: PrivateReducer,
    }
})

