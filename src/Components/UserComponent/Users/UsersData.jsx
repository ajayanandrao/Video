import React, { useContext, useEffect, useMemo, useState } from 'react'
import "./UsersData.scss"
import { AuthContext } from '../../../AuthContaxt';
import { addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../Firebase';
import { motion } from 'framer-motion';

const UsersData = ({ search }) => {
    const { currentUser } = useContext(AuthContext);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingRight, setLoadingRight] = useState(true);

    useEffect(() => {
        const colRef = collection(db, 'users');

        const delay = setTimeout(() => {
            const unsubscribe = onSnapshot(colRef, (snapshot) => {
                const newApi = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
                setUsers(newApi);
                setLoadingRight(false);
            });

            return () => {
                // Cleanup the subscription when the component unmounts
                unsubscribe();
            };
        }, 1000);
        return () => clearTimeout(delay);
    }, []);


    const [check, setCheck] = useState([]);
    useEffect(() => {
        const colRef = collection(db, 'NewFriendRequests')
        const userlist = () => {
            onSnapshot(colRef, (snapshot) => {
                let newbooks = []
                snapshot.docs.forEach((doc) => {
                    newbooks.push({ ...doc.data(), id: doc.id })
                });
                setCheck(newbooks);
            })
        };
        return userlist();
    }, []);

    const sendFriendRequest = async (id, otherUserId, otherUserName, otherUserPhotoUrl) => {
        try {
            const newFriendRequestDocRef = await addDoc(collection(db, 'NewFriendRequests'), {
                senderId: currentUser.uid,
                senderName: currentUser.displayName,
                senderPhotoUrl: currentUser.photoURL,

                receiverPhotoUrl: otherUserPhotoUrl,
                receiverUid: otherUserId,
                receiverName: otherUserName,
                status: 'pending',
                timestamp: serverTimestamp(),
            });

            // Retrieve the unique ID and update the friend request document with it
            const newFriendRequestId = newFriendRequestDocRef.id;
            await updateDoc(newFriendRequestDocRef, { mainid: newFriendRequestId });

            // Create a notification document with the same mainid
            await setDoc(doc(db, "Notification", newFriendRequestId), {
                senderId: currentUser.uid,
                senderName: currentUser.displayName,
                photoUrl: currentUser.photoURL,

                receiverPhotoUrl: otherUserPhotoUrl,
                postSenderUid: otherUserId,
                receiverName: otherUserName,
                status: 'pending',
                timestamp: serverTimestamp(),
                isUnRead: true,
                mainid: newFriendRequestId,
            });

            // console.log('Friend request sent successfully!', id);
        } catch (error) {
            // console.error('Error sending friend request:', error);
        }
    };

    const cancelFriendRequest = async (id, senderId, otherUserId) => {

        // console.log("recipientId :-", otherUserId);
        // console.log("sender :-", senderId);

        try {
            const friendRequestsRef = collection(db, 'NewFriendRequests');
            const querySnapshot = await getDocs(friendRequestsRef);

            querySnapshot.forEach(async (doc) => {
                const request = doc.data();
                if (request.senderId === senderId && request.receiverUid === otherUserId && request.status === 'pending') {
                    deleteDoc(doc.ref);
                    // console.log('Friend request canceled.');

                    const notificationRef = collection(db, 'Notification');
                    const notificationQuerySnapshot = await getDocs(notificationRef);
                    notificationQuerySnapshot.forEach(async (notificationDoc) => {
                        const notificationData = notificationDoc.data();
                        if (notificationData.senderId === senderId &&
                            notificationData.postSenderUid === otherUserId
                            && (notificationData.status === 'pending' || notificationData.status === 'accepted')) {
                            await deleteDoc(notificationDoc.ref);
                            // console.log('Notification deleted.');
                        }
                    });
                }
            });

            //delete Notification 
            const notificationRef = collection(db, 'Notification');

        } catch (error) {
            // console.error('Error canceling friend request:', error);
        }
    };

    const [friendsList, setFriendsList] = useState([]);
    const [dataFetched, setDataFetched] = useState(false);
    useEffect(() => {
        const friendsRef = collection(db, `allFriends/${currentUser && currentUser.uid}/Friends`);
        const unsubscribe = onSnapshot(friendsRef, (snapshot) => {
            const newFriendsList = snapshot.docs.map((doc) => doc.data());
            setFriendsList(newFriendsList);
            setDataFetched(true);
        });

        return unsubscribe;
    }, []);

    const isFriend = (userId) => {
        return friendsList.some((friend) => friend.userId === userId);
    };

    // random

    const shuffleArray = (array) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    };

    // Shuffle the users array randomly

    // const randomlyShuffledUsers = shuffleArray(users);
    const randomlyShuffledUsers = useMemo(() => shuffleArray(users), [users]);;

    const loadingA = [1, 2, 3, 4, 5, 6, 7];


    return (
        <div>

            {loadingRight ?
                <>
                    {loadingA.map((i) => {
                        return (
                            <div className="placeholder-div placeholder-glow" key={i.id}>
                                <div className="placeholder"></div>
                            </div>
                        )
                    })}
                </>
                :
                <>
                    {randomlyShuffledUsers.filter((value) => {
                        if (search === "") {
                            return value;
                        } else if (value.name.toLowerCase().includes(search.toLowerCase())) {
                            return value;
                        }
                    }).map((item) => {

                        if (item.uid !== currentUser.uid) {
                            const friendRequest = check.find(
                                (request) =>
                                    request.senderId === currentUser.uid &&
                                    request.receiverUid === item.uid &&
                                    request.status === 'pending'
                            );

                            const isFriendRequestAccepted = friendsList.some(
                                (friend) =>
                                    friend.userId === item.uid &&
                                    friend.status === 'accepted'
                            );

                            if (isFriendRequestAccepted || isFriend(item.uid)) {
                                return null; // Skip rendering this user
                            }

                            if (dataFetched) {

                                return (
                                    <div key={item.id} className='user-data-div'>
                                        <div style={{ display: "flex", alignItems: "center" }}>
                                            <img src={item.PhotoUrl} className='user-img' alt="" />
                                            <dir className="user-name">
                                                {item.name}
                                            </dir>
                                        </div>
                                        <div style={{ fontSize: "14px", cursor: "pointer" }} >
                                            {friendRequest ? (
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ duration: 0.6 }}

                                                    id={`cancel-${item.id}`}
                                                    style={{ color: "rgba(255, 255, 255, 0.685)" }}
                                                    onClick={() =>
                                                        cancelFriendRequest(
                                                            item.id,
                                                            currentUser.uid,
                                                            item.uid
                                                        )
                                                    }
                                                >
                                                    Unfollow
                                                </motion.div>
                                            ) : isFriendRequestAccepted ? (
                                                <div className="friend-request-accepted">Friend Request Accepted</div>
                                            ) : isFriend(item.uid) ? (
                                                <div className="friend-request-accepted">Friend</div>
                                            ) : dataFetched ? (
                                                <div
                                                    id={`add-${item.id}`}
                                                    onClick={() =>
                                                        sendFriendRequest(
                                                            item.id,
                                                            item.uid,
                                                            item.name,
                                                            item.PhotoUrl
                                                        )
                                                    }
                                                >
                                                    Follow
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                )
                            }
                        }
                    })}
                </>
            }
        </div>
    )
}

export default UsersData