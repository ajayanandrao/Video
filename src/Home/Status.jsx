import React, { useContext, useEffect, useRef, useState } from 'react'
import statusIcon from "./../Assets/status.png";
import { statusData, statusDataClear } from '../Redux/StorySlice';
import { useDispatch, useSelector } from 'react-redux';
import { FaArrowLeft } from 'react-icons/fa6';
import { VscSmiley } from 'react-icons/vsc';
import { IoSend } from 'react-icons/io5';
import { BiSend } from 'react-icons/bi';
import { collection, deleteDoc, doc, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../Firebase';
import { AuthContext } from '../AuthContaxt';
import { statusOff } from '../Redux/CounterSlice';

const Status = () => {

    const { currentUser } = useContext(AuthContext);
    const [stories, setStories] = useState([]);
    useEffect(() => {
        const storiesCollection = collection(db, 'stories');
        const q = query(storiesCollection, where('visible', '==', true));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedStories = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            setStories(fetchedStories);
        });

        return () => unsubscribe();
    }, []);

    const videoRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const handleClick = () => {
        const video = videoRef.current;
        if (video.paused) {
            video.play();
            setIsPlaying(true);
        } else {
            video.pause();
            setIsPlaying(false);
        }
    };

    const deleteStory = async (storyId) => {
        try {
            const storyRef = doc(db, 'stories', storyId);
            const likesQuerySnapshot = await getDocs(
                collection(db, 'stories', storyId, 'likes')
            );
            const commentQuerySnapshot = await getDocs(
                collection(db, 'stories', storyId, 'comments')
            );

            // Delete the story
            await deleteDoc(storyRef);

            // Delete the corresponding likes
            likesQuerySnapshot.forEach(async (doc) => {
                const likeRef = doc.ref;
                await deleteDoc(likeRef);
            });
            commentQuerySnapshot.forEach(async (doc) => {
                const likeRef = doc.ref;
                await deleteDoc(likeRef);
            });
            handleStatusClose();
        } catch (error) {
            console.error('Error deleting story:', error);
        }
    };

    const statusBoolian = stories.find(i => i.uid === currentUser.uid);

    const dispatch = useDispatch();
    const statusOverlay = useSelector(state => state.status);

    const handleStatusClose = () => {
        dispatch(statusOff())
    }

    // story time up 
    const [storiesTime, setStoriesTime] = useState([]);
    const StoryRef = collection(db, 'stories');

    const handleDeletePost = async (storyId) => {
        try {
            const postRef = doc(db, 'stories', storyId);
            // Delete the post
            await deleteDoc(postRef);
            // Optionally, you can delete associated comments, likes, etc., if required
        } catch (error) {
            console.error('Error deleting post:', error);
        }
    };

    useEffect(() => {
        const unsub = () => {
            onSnapshot(StoryRef, (snapshot) => {
                let newbooks = []
                snapshot.docs.forEach((doc) => {
                    newbooks.push({ ...doc.data(), id: doc.id })
                });
                setStoriesTime(newbooks);
            })
        };
        return unsub();
    }, []);
    useEffect(() => {
        storiesTime.forEach((story) => {
            const now = new Date();
            const diff = now - story.timestamp.toDate();
            const hoursPassed = diff / (1000 * 60 * 60);

            if (hoursPassed > 4) {
                handleDeletePost(story.id);
            }
        });
    }, [storiesTime]);

    // End 

    const [countdown, setCountdown] = useState(20);
    // status timer
    useEffect(() => {
        const intervalId = setInterval(() => {
            if (countdown > 0) {
                setCountdown((prevCountdown) => prevCountdown - 1);
            }
        }, 1000);
        return () => clearInterval(intervalId);
    }, [countdown]);

    useEffect(() => {
        if (countdown === 0) {
            handleStatusClose();
            setCountdown(20)
        }
    }, [countdown]);


    return (
        <div>
            <div className="status-container">
                <FaArrowLeft style={{ cursor: "pointer" }} onClick={() => handleStatusClose()} />
                <div className="status-div">

                    <div className="status-profile-div">
                        <div><img src={currentUser && currentUser.photoURL} className='status-img' alt="" /></div>
                        <div className='ms-2' style={{ textTransform: "capitalize", fontSize: "14px" }}>{currentUser && currentUser.displayName}</div>

                        <div className="progressCount">{countdown} sec</div>
                    </div>

                    <div className="status-media-div">
                        {stories.map((story) => {

                            if (story.uid === currentUser.uid) {
                                return (
                                    <div key={story.id}>
                                        {story.image && story.image.includes('.mp4') ? (
                                            <div >
                                                <video ref={videoRef} onClick={handleClick} className="story-video" id="video" autoPlay>
                                                    <source src={story.image} type="video/mp4" />
                                                </video>
                                            </div>
                                        ) : (
                                            <div >
                                                <img src={story.image} className='story-img' alt="Story" />
                                            </div>
                                        )}

                                    </div>
                                );
                            }
                        })}
                    </div>

                    <div className="status-input-div">
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around" }} className='w-100'>

                            <div style={{ fontSize: "14px", cursor: "pointer" }} className='d-flex align-items-center'>
                                Views {}
                            </div>

                            <div style={{ fontSize: "14px", cursor: "pointer" }} onClick={() => { deleteStory(statusBoolian.id); }}>Delete</div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    )
}

export default Status