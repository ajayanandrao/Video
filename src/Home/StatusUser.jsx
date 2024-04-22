import React, { useContext, useEffect, useRef, useState } from 'react'
import statusIcon from "./../Assets/status.png";
import { statusData, statusDataClear } from '../Redux/StorySlice';
import { useDispatch, useSelector } from 'react-redux';
import { FaArrowLeft } from 'react-icons/fa6';
import { VscSmiley } from 'react-icons/vsc';
import { IoSend } from 'react-icons/io5';
import { BiSend } from 'react-icons/bi';
import { addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, query, serverTimestamp, where } from 'firebase/firestore';
import { db } from '../Firebase';
import { AuthContext } from '../AuthContaxt';
import { motion } from "framer-motion";
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';

const StatusUser = () => {

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
            handleStatus();
        } catch (error) {
            console.error('Error deleting story:', error);
        }
    };


    const dispatch = useDispatch();
    const statusOverlay = useSelector(state => state.status);

    const statusBoolian = stories.find(i => i.uid === currentUser.uid);
    // console.log(stories.find(i => i.uid));

    const handleStatus = () => {
        dispatch(statusDataClear())
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
            handleStatus();
            setCountdown(20)
        }
    }, [countdown]);

    // Send Comment 

    const [storyComment, setStoryComment] = useState("");

    const handleStoryComment = async (id, user) => {
        setstatusEmoji(false)
        if (!storyComment) {
            return;
        }
        await addDoc(collection(db, 'stories', id, 'comments'), {
            comment: storyComment,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL,
            uid: currentUser.uid,
            storyUid: user,
            commentTime: serverTimestamp(),
        });

        setStoryComment("");
    }

    // emoji

    new Picker({
        parent: document.querySelector('#picker'),
        data: data,
        emojiButtonSize: 50,
        emojiSize: 38,
        emojiButtonColors: ['rgba(102, 51, 153, .2)'],
        icons: 'solid'
    });

    const addEmoji = (e) => {
        let sym = e.unified.split('-');
        let codesArray = [];
        sym.forEach((el) => codesArray.push('0x' + el));
        let emoji = String.fromCodePoint(...codesArray);
        setStoryComment(storyComment + emoji);

    };

    const [statusEmoji, setstatusEmoji] = useState(false);

    const statusEmojiClick = () => {
        setstatusEmoji(!statusEmoji)
    }

    return (
        <div>
            {statusOverlay.map((i) => {
                return (
                    <>
                        <div className="status-container">
                            <FaArrowLeft style={{ cursor: "pointer" }} onClick={() => { handleStatus(); setstatusEmoji(false); }} />
                            <div className="status-div">

                                <div className="status-profile-div" onClick={() => setstatusEmoji(false)}>
                                    <div><img src={i.photoUrl} className='status-img' alt="" /></div>
                                    <div className='ms-2' style={{ textTransform: "capitalize", fontSize: "14px" }}>{i.displayName}</div>

                                    <div className="progressCount">{countdown} sec</div>
                                </div>

                                <div className="status-media-div" onClick={() => setstatusEmoji(false)}>
                                    <div >
                                        {i.image && i.image.includes('.mp4') ? (
                                            <div >
                                                <video ref={videoRef} onClick={handleClick} className="story-video" id="video" autoPlay>
                                                    <source src={i.image} type="video/mp4" />
                                                </video>
                                            </div>
                                        ) : (
                                            <div >
                                                <img src={i.image} className='story-img' alt="Story" />
                                            </div>
                                        )}

                                    </div>
                                </div>

                                {statusEmoji &&
                                    <motion.div
                                        initial={{ y: 100 }}
                                        animate={{ y: 0 }}
                                        transition={{ duration: 0.5, type: "spring" }}
                                        className="status-emoji">
                                        <Picker
                                            dynamicWidth={false}
                                            emojiSize={20}
                                            emojiButtonSize={36}
                                            onEmojiSelect={addEmoji}
                                        />
                                    </motion.div>
                                }

                                <div className="status-input-div" id='color'>
                                    <VscSmiley className='status-icons' onClick={statusEmojiClick} />

                                    <input type="text" placeholder='Type a message'
                                        className='status-input'
                                        onChange={(e) => setStoryComment(e.target.value)}
                                        onClick={() => setstatusEmoji(false)}
                                        value={storyComment}
                                    />

                                    <BiSend className='status-icons' onClick={() => handleStoryComment(i.id, i.uid)} />
                                </div>
                            </div>
                        </div>
                    </>
                )
            }
            )}
        </div>
    )
}

export default StatusUser