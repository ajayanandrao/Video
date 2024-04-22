import React, { useContext, useEffect, useRef, useState } from 'react'
import "./Home.scss";
import UserComponent from '../Components/UserComponent/UserComponent';
import MessageComponents from '../Components/MessageComponents/MessageComponents';
import { FaArrowLeft } from 'react-icons/fa6';
import { VscSmiley } from 'react-icons/vsc';
import { IoSend } from 'react-icons/io5';
import { BiSend } from 'react-icons/bi';
import { collection, deleteDoc, doc, getDocs, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '../Firebase';
import { AuthContext } from '../AuthContaxt';
import statusIcon from "./../Assets/status.png";
import { statusData, statusDataClear } from '../Redux/StorySlice';
import { useDispatch, useSelector } from 'react-redux';
import Status from './Status';
import StatusUser from './StatusUser';
import Audio from '../Components/Audio';
import VideoCall from './VideoCall.js/VideoCall';

const Home = () => {
    const [userData, setuserData] = useState("");
    const [friendId, setFriendId] = useState("");
    const [accept, setAcceptId] = useState("");
    const [getuser, setgetuser] = useState();

    const { currentUser } = useContext(AuthContext);
    const statusOverlay = useSelector(state => state.status);
    const statusOverlayCurrent = useSelector(state => state.counter.status);

    const handalData = (num, id, accepterID, uid) => {
        setuserData(id);
        setFriendId(num);
        setAcceptId(accepterID);
        setgetuser(uid)
    }
    const handalDataEmty = (id) => {
        setuserData(id);
    }

    const [messages, setMessages] = useState([]);

    useEffect(() => {
        const fetchFriends = async () => {
            try {
                const PresenceRefOnline = doc(db, 'OnlyOnline', currentUser && currentUser.uid);
                setDoc(PresenceRefOnline, {
                    status: 'Online',
                    uid: currentUser.uid,
                    presenceName: currentUser.displayName,
                    email: currentUser.email,
                    photoUrl: currentUser.photoURL,
                    presenceTime: new Date(),
                    timestamp: serverTimestamp()
                });
                // Simulate a delay of 2 seconds (you can adjust the delay as needed)
                setTimeout(async () => {
                    const friendsQuery = query(
                        collection(db, `allFriends/${currentUser && currentUser.uid}/Message`),
                        orderBy('time', 'asc') // Reverse the order to show newest messages first
                    );

                    const unsubscribe = onSnapshot(friendsQuery, (friendsSnapshot) => {
                        const friendsData = friendsSnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
                        // Reverse the order of messages to show newest messages first
                        setMessages(friendsData.reverse());
                    });

                    // Return the unsubscribe function to stop listening to updates when the component unmounts
                    return () => unsubscribe();
                }, 2000); // Delay for 2 seconds (2000 milliseconds)
            } catch (error) {
                console.error('Error fetching friends:', error);
            }
        };

        fetchFriends();
    }, [currentUser]);

    useEffect(() => {
        const handleBeforeUnload = async () => {
            // Update Firestore document when the browser is closed
            const PresenceRefOnline = doc(db, 'OnlyOnline', currentUser && currentUser.uid);

            try {
                // Delete the document from Firestore
                await updateDoc(PresenceRefOnline, {
                    status: 'Offline',
                    presenceTime: new Date(),
                    timestamp: serverTimestamp()
                });
            } catch (error) {
                console.error('Error deleting PresenceRefOnline:', error);
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [currentUser]);


    const [stories, setStories] = useState([]);

    const StoryRef = collection(db, 'stories');

    useEffect(() => {
        const unsub = () => {
            onSnapshot(StoryRef, (snapshot) => {
                let newbooks = []
                snapshot.docs.forEach((doc) => {
                    newbooks.push({ ...doc.data(), id: doc.id })
                });
                setStories(newbooks);
            })
        };
        return unsub();
    }, []);


    useEffect(() => {
        // For each fetched post, check and delete if expired
        stories.forEach((story) => {
            const now = new Date();
            const diff = now - story.timestamp.toDate();
            const hoursPassed = diff / (1000 * 60 * 60); // Calculate hours passed

            if (hoursPassed > 4) {
                handleDeletePost(story.id);
            }
        });
    }, [stories]);

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


    const [api, setApiData] = useState([]);
    useEffect(() => {
        const colRef = collection(db, 'users');
        const unsubscribe = onSnapshot(colRef, (snapshot) => {
            const newApi = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
            setApiData(newApi);
        });

        return unsubscribe;
    }, []);
    // ======================================================


    return (
        <div className='home-main'>

            {/* {messages.slice(0, 1).map((sms) => {

                const isSender = sms.sender === currentUser.uid;

                return (
                    <div key={sms.id}>

                        {
                            sms.photo === 'unseen' ? (
                                <div>
                                    {sms.sound === "on" ? <Audio /> : ""}
                                </div>
                            ) : null
                        }


                    </div>
                );
            })}

            {statusOverlay.map((i) => {
                if (i.overlay) {
                    return (
                        <StatusUser />
                    )
                }
            })}
            {statusOverlayCurrent &&
                <Status />
            }
            <UserComponent handalData={handalData} />
            <MessageComponents userId={userData} getUserUid={getuser} handalDataEmty={handalDataEmty} friendId={friendId} accepterId={accept} /> */}

            <VideoCall />


        </div >
    )
}

export default Home