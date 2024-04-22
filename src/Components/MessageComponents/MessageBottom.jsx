import React, { useContext, useEffect, useRef, useState } from 'react'
import { ImLink } from 'react-icons/im'
import { IoCloseCircleOutline, IoSend, IoVideocamOutline } from 'react-icons/io5'
import { MdEmojiEmotions } from 'react-icons/md'

import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc, where, writeBatch } from 'firebase/firestore';
import { auth, db, storage } from '../../Firebase';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { v4 } from 'uuid';
import { AuthContext } from '../../AuthContaxt';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from "framer-motion"
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { emojiFalse, emojiTrue, imgFalse, imgTrue } from '../../Redux/CounterSlice';
import { VscSend, VscSmiley } from "react-icons/vsc";
import { IoClose } from "react-icons/io5";
import { PiMicrophone } from "react-icons/pi";
import { BsMic } from 'react-icons/bs';
import { IoMdCloseCircleOutline } from "react-icons/io";
import { handleRplayDataClear } from '../../Redux/Replay';
import { CiImageOn } from "react-icons/ci";
import Emoji from './Emoji';

const MessageBottom = ({ user, messageOptionClose, setchatOpton, params }) => {
    const { currentUser } = useContext(AuthContext);
    const [loadingProgress, setLoadingProgress] = useState("");
    const [img, setImg] = useState(null);
    const [messageEmoji, setMessageEmoji] = useState(false);
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState("");
    const [replyInput, setReplyInput] = useState("");
    const [isPlaying, setIsPlaying] = useState(false);
    const [viewMessageInput, setViewMessageInput] = useState("");
    const [viewMessageImg, setViewMessageImg] = useState(null);
    const [viewReplyImgUrl, setViewReplyImgUrl] = useState(null);
    const [replyImgTime, setReplyImgTime] = useState("");
    const [viewReplyVideoUrl, setViewReplyVideoUrl] = useState(null);

    const videoRef = useRef(null);
    const togglePlayPause = () => {
        const video = videoRef.current;
        if (video) {
            if (isPlaying) {
                video.pause();
            } else {
                video.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleMessageEmojiF = () => {
        setMessageEmoji(false);
    }
    const isReplay = useSelector((state) => state.replay);

    const ReplayDataClearFunction = () => {
        dispatch(handleRplayDataClear())
    }

    const selectedMessageIdReplay = isReplay.find(id => id.id);
    var selectedMessageIdReplayId = selectedMessageIdReplay && selectedMessageIdReplay.id;

    useEffect(() => {
        setMessageInput("")
    }, [params]);

    const dispatch = useDispatch();

    const handleTyping = () => {
        const typingRef = doc(db, 'typingStatus', currentUser && currentUser.uid);
        if (messageInput != "") {
            setDoc(typingRef, { isTyping: true });
        }
        if (messageInput == "") {
            setTimeout(() => {
                setDoc(typingRef, { isTyping: false });
            }, 1);
        }
    };


    const handleKeyPress = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            if (selectedMessageIdReplayId) {
                sendReply(selectedMessageIdReplayId, user && user.uid, user && user.name, user && user.userPhoto);
            } else {
                sendMessage(user && user.uid, user && user.name, user && user.userPhoto);
            }
            ReplayDataClearFunction();
        }
    };

    const handleLatestSms = async (uid, name, photo) => {
        const latestRef = collection(db, "NewMessage");

        const data = {
            reciverUid: uid,
            reciverName: name,
            reciverPhoto: photo,
            senderUid: currentUser.uid,
            senderName: currentUser.displayName,
            timestamp: serverTimestamp(),
        };
        await addDoc(latestRef, data);

    };

    const PdfOptionCloseAll = () => {
        // const pdfOption = document.querySelectorAll('.pdfView-Option');
        // pdfOption.forEach(dropdown => {
        //     dropdown.style.display = 'none';
        // });
    }

    const AudioOptionCloseAll = () => {
        // const pdfOption = document.querySelectorAll('.audio');
        // pdfOption.forEach(dropdown => {
        //     dropdown.style.display = 'none';
        // });
    }

    useEffect(() => {
        const messagesRef = collection(db, 'messages');

        if (user && selectedMessageIdReplayId) {
            const q = query(
                messagesRef,
                where('sender', 'in', [currentUser && currentUser.uid, user.uid]),
                where('recipient', 'in', [currentUser && currentUser.uid, user.uid]),
                orderBy('timestamp', 'asc')
            );

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const messages = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data()
                }));

                setMessages(messages);
            });

            return () => unsubscribe();
        }
    }, [currentUser, user, selectedMessageIdReplayId]);


    const sendReply = async (messageId, uid, name, recipientImg) => {

        if (!messageInput) {
            return
        }

        const selectedMessage = messages.find((message) => message.id === messageId);

        const messagesRef = collection(db, 'messages');

        if (selectedMessage && selectedMessage.sender) {
            let replyContent = `Reply: ${selectedMessage.message || ""}`;

            if (selectedMessage.imageUrl) {
                replyContent = `Reply to: ${selectedMessage.imageUrl}`;
            }

            if (selectedMessage.videoUrl) {
                replyContent = `Reply to video: ${selectedMessage.videoUrl}`;
                console.log("lik", selectedMessage);
            }

            // Create a new document using `addDoc` function
            const newMessage = {
                sender: currentUser.uid, // Set the sender's ID
                recipient: selectedMessage.sender, // Set the recipient's ID
                message: messageInput, // Set the message content
                sound: "on",
                timestamp: serverTimestamp(), // Set the timestamp (server-side)
                reply: replyContent,
                replyId: messageId
            };

            const docRef = await addDoc(messagesRef, newMessage);

            const messageIdNew = docRef.id;

            await updateDoc(doc(db, "messages", messageId), {
                senderReplayedId: messageIdNew
            })



            const messageData1 = {
                userId: currentUser.uid,
                name: currentUser.displayName,
                photoUrl: currentUser.photoURL,
                status: "unseen",
                time: serverTimestamp(),

            };

            const messageData2 = {
                userId: uid,
                name: name,
                photoUrl: recipientImg,
                status: "unseen",
                time: serverTimestamp(),
            };

            const docRef1 = doc(db, `allFriends/${uid}/Message`, currentUser.uid);
            const docRef2 = doc(db, `allFriends/${currentUser.uid}/Message`, uid);

            const promises = [];

            promises.push(setDoc(docRef1, messageData1, { merge: true }));
            promises.push(setDoc(docRef2, messageData2, { merge: true }));

            await Promise.all(promises);

        }

        ReplayDataClearFunction();
        setMessageInput("");

    };

    // 

    const compressImage = async (imageFile, maxWidth) => {
        return new Promise((resolve, reject) => {
            const img = new Image();

            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                const aspectRatio = img.width / img.height;
                const newWidth = Math.min(maxWidth, img.width);
                const newHeight = newWidth / aspectRatio;

                canvas.width = newWidth;
                canvas.height = newHeight;

                ctx.drawImage(img, 0, 0, newWidth, newHeight);

                canvas.toBlob(resolve, 'image/jpeg', 0.7); // Adjust the compression quality if needed
            };

            img.onerror = reject;

            img.src = URL.createObjectURL(imageFile);
        });
    };

    const [loading, setloading] = useState("");

    // const [smsCount, setsmsCount] = useState(1);

    // const handlSmsCount = () => {
    //     setsmsCount(number => number + 1);
    //     console.log(smsCount)
    // }

    const sendMessage = async (uid, name, recipientImg) => {
        // setsmsCount(number => number + 1);
        try {
            const messagesRef = collection(db, 'messages');
            const currentUser = auth.currentUser;

            const typingRef = doc(db, 'typingStatus', currentUser && currentUser.uid);
            setDoc(typingRef, { isTyping: false });

            // Prepare the new message object
            const newMessage = {
                sender: currentUser.uid,
                senderImg: currentUser.photoURL,
                recipient: uid,
                recipientImg: recipientImg,
                sound: "on",
                timestamp: serverTimestamp(),
            };

            if (messageInput) {
                newMessage.message = messageInput;
                setMessageInput(""); // Clear the message input field
            }

            if (img) {
                if (img.type.startsWith('image/')) {
                    const compressedImgBlob = await compressImage(img, 800);

                    const storageRef = ref(storage, `messageImages/${img.name}`);
                    const uploadTask = uploadBytesResumable(storageRef, compressedImgBlob);

                    uploadTask.on(
                        'state_changed',
                        (snapshot) => {
                            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                            // console.log('Upload progress: ' + progress + '%');
                            if (progress < 100) {
                                setloading(progress);
                                document.getElementById("progress").style.display = "block";
                            } else {
                                setImg(null);
                                setloading("");
                                document.getElementById("progress").style.display = "none";
                            }
                        },
                        (error) => {
                            console.error('Upload error:', error);
                        },
                        async () => {
                            try {
                                const imageUrl = await getDownloadURL(storageRef);
                                newMessage.imageUrl = imageUrl;
                                await addDoc(messagesRef, newMessage);
                            } catch (error) {
                                console.error('Error uploading image:', error);
                            }
                        }
                    );
                }

                // Check the type of the selected file
                else if (img.type.startsWith('audio/')) {
                    // Create a reference to the Firebase Storage location where you want to upload the audio file
                    const storageRef = ref(storage, `audioFiles/${img.name}`);

                    // Upload the audio file
                    try {
                        const uploadTask = uploadBytesResumable(storageRef, img);

                        uploadTask.on('state_changed',
                            (snapshot) => {
                                // Handle upload progress (if needed)
                            },
                            (error) => {
                                console.error('Upload error:', error);
                                // Handle the error (e.g., display an error message)
                            },
                            async () => {
                                // Upload is complete, get the download URL
                                try {
                                    const audioUrl = await getDownloadURL(storageRef);
                                    newMessage.AudioFileUrl = audioUrl; // You can customize the field name
                                    newMessage.AudioName = img.name; // You can customize the field name
                                    await addDoc(messagesRef, newMessage);
                                    // Now you can use the audioUrl as needed, such as storing it in a message object and sending it
                                    // You can also update your Firestore database with this URL
                                } catch (error) {
                                    console.error('Error getting audio URL:', error);
                                    // Handle the error (e.g., display an error message)
                                }
                            }
                        );
                    } catch (error) {
                        console.error('Error uploading audio file:', error);
                        // Handle the error (e.g., display an error message)
                    }
                }

                else if (img.type === 'text/plain') {
                    // Handle text file upload
                    const storageRef = ref(storage, `messageFiles/${img.name}`);
                    const uploadTask = uploadBytesResumable(storageRef, img);

                    uploadTask.on(
                        'state_changed',
                        // ... (progress and error handling code)
                        (snapshot) => {
                            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                            // console.log('Upload progress: ' + progress + '%');
                            if (progress < 100) {
                                document.getElementById("progress").style.display = "block";
                            } else {
                                setImg(null);
                                document.getElementById("progress").style.display = "none";
                            }
                        },
                        (error) => {
                            console.error('Upload error:', error);
                        },
                        async () => {
                            try {
                                const fileUrl = await getDownloadURL(storageRef);
                                newMessage.textFileUrl = fileUrl; // You can customize the field name
                                newMessage.txtName = img.name; // You can customize the field name
                                await addDoc(messagesRef, newMessage);
                                // console.log("txt file added successfully");
                            } catch (error) {
                                console.error('Error uploading text file:', error);
                            }
                        }
                    );
                }

                else if (img.type === 'application/pdf') {
                    // Handle PDF file upload
                    const storageRef = ref(storage, `messageFiles/${img.name}`);
                    const uploadTask = uploadBytesResumable(storageRef, img);

                    uploadTask.on(
                        'state_changed',
                        (snapshot) => {
                            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                            // console.log('Upload progress: ' + progress + '%');
                            if (progress < 100) {
                                document.getElementById("progress").style.display = "block";
                            } else {
                                setImg(null);
                                document.getElementById("progress").style.display = "none";
                            }
                        },
                        (error) => {
                            console.error('Upload error:', error);
                        },
                        async () => {
                            try {
                                const fileUrl = await getDownloadURL(storageRef);
                                newMessage.pdfUrl = fileUrl; // You can customize the field name
                                newMessage.pdfName = img.name; // You can customize the field name
                                await addDoc(messagesRef, newMessage);
                                // console.log("PDF file added successfully");
                            } catch (error) {
                                console.error('Error uploading PDF:', error);
                            }
                        }
                    );
                }

                else if (img.type === 'compressed') {
                    // Handle ZIP or RAR file upload
                    const storageRef = ref(storage, `messageFiles/${img.name}`);
                    const uploadTask = uploadBytesResumable(storageRef, img);

                    uploadTask.on(
                        'state_changed',
                        (snapshot) => {
                            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                            // console.log('Upload progress: ' + progress + '%');
                            if (progress < 100) {
                                document.getElementById("progress").style.display = "block";
                            } else {
                                setImg(null);
                                document.getElementById("progress").style.display = "none";
                            }
                        },
                        (error) => {
                            console.error('Upload error:', error);
                        },
                        async () => {
                            try {
                                const fileUrl = await getDownloadURL(storageRef);
                                newMessage.archiveUrl = fileUrl; // You can customize the field name
                                newMessage.archiveName = img.name; // Set the field for the file name
                                await addDoc(messagesRef, newMessage);
                                // console.log("zip/rar file added successfully");
                            } catch (error) {
                                console.error('Error uploading archive file:', error);
                            }
                        }
                    );
                }

                else if (img.type.startsWith('video/')) {
                    const storageRef = ref(storage, 'messageVideos/' + v4());
                    const uploadTask = uploadBytesResumable(storageRef, img);

                    uploadTask.on(
                        'state_changed',
                        (snapshot) => {
                            const progress = Math.round(
                                (snapshot.bytesTransferred / snapshot.totalBytes) * 100
                            );
                            // console.log('Upload progress:', progress);
                            setLoadingProgress(progress);
                            if (progress == 100) {
                                setImg(null);
                                setLoadingProgress(false);
                                setIsPlaying(false);
                            }
                            if (progress < 100) {
                                document.getElementById('progress').style.display = 'block';
                            } else {
                                document.getElementById('progress').style.display = 'none';
                            }
                        },
                        (error) => {
                            console.error('Error uploading video:', error);
                        },
                        async () => {
                            try {
                                const videoUrl = await getDownloadURL(storageRef);
                                newMessage.videoUrl = videoUrl;
                                await addDoc(messagesRef, newMessage);
                            } catch (error) {
                                console.error('Error uploading video:', error);
                            }
                        }
                    );
                }
            } else if (newMessage.message) {
                await addDoc(messagesRef, newMessage);
            }

            // Update sender's and recipient's friend lists

            const messageData1 = {
                userId: currentUser.uid,
                name: currentUser.displayName,
                photoUrl: currentUser.photoURL,
                status: "unseen",
                sound: "on",
                photo: "unseen",
                // count: smsCount,
                time: serverTimestamp(),

            };

            const messageData2 = {
                userId: uid,
                name: name,
                photoUrl: recipientImg,
                status: "unseen",
                photo: "seen",
                sound: "on",
                time: serverTimestamp(),
            };

            const docRef1 = doc(db, `allFriends/${uid}/Message`, currentUser.uid);
            const docRef2 = doc(db, `allFriends/${currentUser.uid}/Message`, uid);

            const promises = [];

            promises.push(setDoc(docRef1, messageData1, { merge: true }));
            promises.push(setDoc(docRef2, messageData2, { merge: true }));

            await Promise.all(promises);

        } catch (error) {
            console.error("Error sending message:", error);
        }
        handleLatestSms(uid, name, recipientImg);
        setViewMessageInput(null);
    };

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
        setMessageInput(messageInput + emoji);

    };

    const emojiStatus = useSelector(state => state.counter.emoji);
    const imgStatus = useSelector(state => state.counter.img);

    useEffect(() => {
        if (!imgStatus) {
            setImg(null);
        }
    }, [imgStatus]);

    const handleEmojiOverlay = () => {
        dispatch(emojiTrue())
    }
    const handleEmojiClose = () => {
        dispatch(emojiFalse())
    }

    const handleImgOverlay = () => {
        dispatch(imgTrue())
    }
    const handleImgClose = () => {
        setImg(null)
        dispatch(imgFalse())
    }


    return (
        <>
            {emojiStatus &&
                <motion.div
                    initial={{ y: 100 }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.5, type: "spring" }}
                    className="emoji-div-threeD">
                    <Emoji />
                </motion.div>
            }

            {emojiStatus &&
                <motion.div
                    initial={{ y: 100 }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.5, type: "spring" }}
                    className="emoji-div">
                    <Picker
                        dynamicWidth={false}
                        emojiSize={20}
                        emojiButtonSize={36}
                        onEmojiSelect={addEmoji}
                    />
                </motion.div>
            }

            {img && imgStatus &&
                <motion.div
                    initial={{ y: 100 }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.5, type: "spring" }}
                    className="message-bottom-img-div">
                    <div className="message-img-close-div">
                        <IoClose onClick={() => { setImg(null); handleImgClose(); }} />
                    </div>


                    {img && img.type.startsWith("video/") ?
                        <video ref={videoRef} className="device-video-selected" onClick={togglePlayPause}>
                            <source src={URL.createObjectURL(img)} />
                        </video>
                        :
                        <img className='message-bottom-img' src={img ? URL.createObjectURL(img) : null} alt="" />
                    }


                    <div className='sendBtn-Overlay' onClick={() => {
                        if (selectedMessageIdReplayId) {
                            sendReply(selectedMessageIdReplayId, user && user.uid, user && user.name, user && user.userPhoto);

                        } else {
                            sendMessage(user && user.uid, user && user.name, user && user.userPhoto);
                        }
                        handleMessageEmojiF();
                        handleEmojiClose();
                    }}>
                        <IoSend style={{ fontSize: "20px", cursor: "pointer", color: `${messageInput != "" ? "#25d366" : "white"}` }}
                        />
                    </div>

                </motion.div>
            }

            {isReplay.map((item) => {
                return (
                    <>
                        <div className="replay-view-container" >
                            <div className="replay-view-name">{item.name}</div>
                            <div className="replay-view-message">
                                {item.message}


                                {item.videoUrl && <div className='d-flex align-items-center'>
                                    <IoVideocamOutline style={{ fontSize: "18px" }} /> <span className='mx-2 me-5'>Video</span>
                                    <video ref={videoRef} className=" viewVideoClass" >
                                        <source src={item.videoUrl} />
                                    </video>
                                </div>}


                                {item.photoUrl && <div className='d-flex align-items-center'>
                                    <CiImageOn style={{ fontSize: "18px" }} /> <span className='mx-2 me-5'>Image</span>
                                    <img src={item.photoUrl} className='replay-view-img' alt="" />
                                </div>}

                            </div>
                            <div className="replay-view-close" onClick={ReplayDataClearFunction}>
                                <IoCloseCircleOutline />
                            </div>
                        </div>
                    </>
                )
            })}

            <div className="progress" id='progress'>
                <div className="progress-bar" role="progressbar" style={{ width: `${loading}%` }} aria-valuenow="25" aria-valuemin="0" aria-valuemax="100">
                </div>
            </div>

            <div className="message-bottom-bar" onClick={() => { messageOptionClose(); setchatOpton(false) }}>
                <div className="message-bottom-div">
                    {emojiStatus ?
                        <VscSmiley onClick={() => { handleEmojiClose(); setImg(null); }} style={{ fontSize: "22px", marginRight: "1.5rem", cursor: "pointer" }} />
                        :
                        <VscSmiley onClick={() => { handleEmojiOverlay(); setImg(null); }} style={{ fontSize: "22px", marginRight: "1.5rem", cursor: "pointer" }} />
                    }

                    <label htmlFor="imgFiles" onClick={() => { handleEmojiClose(); setImg(null); handleMessageEmojiF(); setLoadingProgress(false); PdfOptionCloseAll(); AudioOptionCloseAll(); handleImgOverlay(); }}>
                        <ImLink style={{ fontSize: "18px", cursor: "pointer" }} />
                    </label>
                    <input id='imgFiles' style={{ display: "none" }} type="file" onChange={(e) => setImg(e.target.files[0])} />

                    <input type="text" placeholder='Message' className='message-input'
                        onChange={(e) => setMessageInput(e.target.value)}
                        value={messageInput}
                        onKeyUp={handleTyping}
                        id="messageInput"
                        onClick={handleEmojiClose}
                        onKeyDown={handleKeyPress}
                    />

                    <VscSend className='MessageSendBtn' style={{ color: `${messageInput != "" ? "white" : "#cccc"}` }}
                        onClick={() => {
                            if (selectedMessageIdReplayId) {
                                sendReply(selectedMessageIdReplayId, user && user.uid, user && user.name, user && user.userPhoto);

                            } else {
                                sendMessage(user && user.uid, user && user.name, user && user.userPhoto);
                            }
                            handleMessageEmojiF();
                            handleEmojiClose();

                        }}
                    />
                    <img src="https://drive.google.com/file/d/1Bmg3CVoEvD898594kxF9_9-pD5o6mfHl/view?usp=sharing" alt="" />
                    <BsMic style={{ fontSize: "19px", cursor: "pointer", }} />
                </div>
            </div>
        </>
    )
}

export default MessageBottom