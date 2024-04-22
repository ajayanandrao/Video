import React, { useContext, useEffect, useState } from 'react'
import "./Login.scss"
import { FcGoogle } from "react-icons/fc";
import { motion } from "framer-motion"
import logo from "./../../../Assets/logo.png";
import { Link, useNavigate } from 'react-router-dom'
import { AuthContext } from '../../../AuthContaxt';
import { auth, db, provider, providerFacebook, providerGit, providerMicrosoft, realdb, storage } from '../../../Firebase';
import { addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { GoogleAuthProvider, GithubAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, updateProfile, FacebookAuthProvider, OAuthProvider, setPersistence, browserSessionPersistence, signOut } from 'firebase/auth';
import CircularProgress from '@mui/material/CircularProgress';


const Login = () => {
    const { currentUser } = useContext(AuthContext);
    const [email, setEmail] = useState("");
    const [password, setPass] = useState("");

    const [loading, setLoading] = useState(true);

    const nav = useNavigate();

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                // Simulating an asynchronous operation with setTimeout
                setLoading(true);
                setTimeout(() => {
                    nav("/home");
                    setLoading(false);
                }, 1000);
            } else {
                setTimeout(() => {
                    nav("/");
                    setLoading(false); // Stop showing loading state
                }, 1000);
            }
        });



        return () => {
            unsubscribe(); // Cleanup the subscription when the component unmounts
        };
    }, []);

    const [loginloading, setLoginLoading] = useState(false);

    const login = async (e) => {
        e.preventDefault();
        setLoginLoading(true);
        signInWithEmailAndPassword(auth, email, password)

            .then(async (userCredential) => {
                // Signed in
                const user = userCredential.user;
                // console.log(user.uid)
                const PresenceRef = doc(db, "userPresece", user.uid);
                await updateDoc(PresenceRef, { status: "online" });

                const PresenceRefOnline = doc(db, "OnlyOnline", user.uid);
                const userData = {
                    status: 'Online',
                    uid: user.uid,
                    presenceName: user.displayName,
                    email: email,
                    photoUrl: user.photoURL,
                    presenceTime: new Date(),
                    timestamp: serverTimestamp()
                };
                await setDoc(PresenceRefOnline, userData);

                // Navigate to the home page or perform other actions
                nav("/home");

            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                // console.log(errorCode);
                setLoginLoading(false);

                // Handle different error codes and display appropriate messages
                switch (errorCode) {
                    case "auth/wrong-password":
                        document.getElementById("error-alert").style.display = "flex";
                        document.getElementById("error-alert").innerHTML = "Wrong Password";
                        break;
                    case "auth/invalid-login-credentials":
                        document.getElementById("error-alert").style.display = "flex";
                        document.getElementById("error-alert").innerHTML = "Wrong Password";
                        break;
                    case "auth/missing-password":
                        document.getElementById("error-alert").style.display = "flex";
                        document.getElementById("error-alert").innerHTML = "Incorrect email and password";
                        break;
                    case "auth/user-not-found":
                        document.getElementById("error-alert").style.display = "flex";
                        document.getElementById("error-alert").innerHTML = "User not found";
                        break;
                    case "auth/invalid-email":
                        document.getElementById("error-alert").style.display = "flex";
                        document.getElementById("error-alert").innerHTML = "Invalid email address";
                        break;
                    case "auth/network-request-failed":
                        document.getElementById("error-alert").style.display = "flex";
                        document.getElementById("error-alert").innerHTML = "Check your internet connection";
                        break;
                    default:
                    // Handle other errors as needed
                }
            });

        // setPersistence(auth, browserSessionPersistence)
        //     .then(async () => {
        //         // Existing and future Auth states are now persisted in the current
        //         // session only. Closing the window would clear any existing state even
        //         // if a user forgets to sign out.
        //         // ...
        //         // New sign-in will be persisted with session persistence.
        //         // return signInWithEmailAndPassword(auth, email, password);
        //         return signInWithEmailAndPassword(auth, email, password)

        //             .then(async (userCredential) => {
        //                 // Signed in
        //                 const user = userCredential.user;
        //                 console.log(user.uid)
        //                 const PresenceRef = doc(db, "userPresece", user.uid);
        //                 await updateDoc(PresenceRef, { status: "online" });

        //                 const PresenceRefOnline = doc(db, "OnlyOnline", user.uid);
        //                 const userData = {
        //                     status: 'Online',
        //                     uid: user.uid,
        //                     presenceName: user.displayName,
        //                     email: email,
        //                     photoUrl: user.photoURL,
        //                     presenceTime: new Date()
        //                 };
        //                 await setDoc(PresenceRefOnline, userData);
        //                 // Navigate to the home page or perform other actions
        //                 nav("/home");

        //             })
        //             .catch((error) => {
        //                 const errorCode = error.code;
        //                 const errorMessage = error.message;
        //                 // console.log(errorCode);
        //                 setLoginLoading(false);

        //                 // Handle different error codes and display appropriate messages
        //                 switch (errorCode) {
        //                     case "auth/wrong-password":
        //                         document.getElementById("error-alert").style.display = "flex";
        //                         document.getElementById("error-alert").innerHTML = "Wrong Password";
        //                         break;
        //                     case "auth/invalid-login-credentials":
        //                         document.getElementById("error-alert").style.display = "flex";
        //                         document.getElementById("error-alert").innerHTML = "Wrong Password";
        //                         break;
        //                     case "auth/missing-password":
        //                         document.getElementById("error-alert").style.display = "flex";
        //                         document.getElementById("error-alert").innerHTML = "Incorrect email and password";
        //                         break;
        //                     case "auth/user-not-found":
        //                         document.getElementById("error-alert").style.display = "flex";
        //                         document.getElementById("error-alert").innerHTML = "User not found";
        //                         break;
        //                     case "auth/invalid-email":
        //                         document.getElementById("error-alert").style.display = "flex";
        //                         document.getElementById("error-alert").innerHTML = "Invalid email address";
        //                         break;
        //                     case "auth/network-request-failed":
        //                         document.getElementById("error-alert").style.display = "flex";
        //                         document.getElementById("error-alert").innerHTML = "Check your internet connection";
        //                         break;
        //                     default:
        //                     // Handle other errors as needed
        //                 }
        //             });
        //     })
        //     .catch((error) => {
        //         // Handle Errors here.
        //         const errorCode = error.code;
        //         const errorMessage = error.message;
        //         console.log(errorMessage)
        //     })

        setEmail("");
        setPass("");
    };


    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault(); // Prevent default form submission
            login(e); // Call the login function when Enter key is pressed
        }
    };

    if (!email == "") {
        document.getElementById("error-alert").innerHTML = "";
    }
    if (!password == "") {
        document.getElementById("error-alert").innerHTML = "";
    }

    const [showFooter, setShowFooter] = useState(false);

    useEffect(() => {
        // Use setTimeout to toggle the 'showFooter' state after 2 seconds
        const timeoutId = setTimeout(() => {
            setShowFooter(true);
        }, 1500);

        // Cleanup the timeout to prevent memory leaks when the component unmounts
        return () => clearTimeout(timeoutId);
    }, []);

    document.body.addEventListener('contextmenu', function (event) {
        event.preventDefault(); // Prevent the default context menu
        // You can optionally display a custom message if needed
        // alert('Right-click context menu is disabled.');
    });


    useEffect(() => {
        const handleContextMenu = (event) => {
            event.preventDefault(); // Prevent the default context menu
            // alert('Access Denied');
        };

        document.body.addEventListener('contextmenu', handleContextMenu);

        return () => {
            document.body.removeEventListener('contextmenu', handleContextMenu);
        };
    }, []);

    const HandleGoogleAuth = async () => {
        try {
            const result = await signInWithPopup(auth, provider);
            const credential = GoogleAuthProvider.credentialFromResult(result);
            const token = credential.accessToken;
            const user = result.user;
            const colRef = collection(db, "users");
            const userQuery = query(colRef, where("uid", "==", currentUser.uid));
            const querySnapshot = await getDocs(userQuery);

            if (querySnapshot.empty) {
                try {
                    await addDoc(colRef, {
                        uid: user.uid,
                        name: user.displayName,
                        email: user.email,
                        PhotoUrl: user.photoURL,
                        accessToken: user.accessToken,

                        school: "",
                        college: "",
                        work: "",
                        from: "",
                        intro: "",
                        bytime: serverTimestamp(),
                    });

                    const userPreferencesRef = doc(db, 'UserPreferences', currentUser.uid);
                    await setDoc(userPreferencesRef, { theme: "light" });

                    // console.log("New user document added:");

                } catch (error) {
                    console.error("Error adding the user document:", error);
                }
            } else {
                // A document with the same UID already exists
                // console.log("User document with the same UID already exists.");
            }


        } catch (error) {
            // Handle Errors here.
            const errorCode = error.code;
            const errorMessage = error.message;

            // If the error provides additional email information:
            const email = error.email;

            // You can also get the AuthCredential type used for the error, if available.
            const credential = GoogleAuthProvider.credentialFromError(error);

            // Handle the error (e.g., display an error message to the user).
            console.error('Google Authentication Error:', errorCode, errorMessage);

            // You can customize the error handling based on your application's needs.
        }
    };


    const HandleMicrosoftAuth = async () => {
        try {
            const result = await signInWithPopup(auth, providerMicrosoft);
            const credential = OAuthProvider.credentialFromResult(result);
            const token = credential.accessToken;
            const user = result.user;
            // console.log(user);
            const colRef = collection(db, "users");
            const userQuery = query(colRef, where("uid", "==", currentUser.uid));
            const querySnapshot = await getDocs(userQuery);

            if (querySnapshot.empty) {
                try {
                    await addDoc(colRef, {
                        uid: user.uid,
                        name: user.displayName,
                        email: user.email,
                        PhotoUrl: user.photoURL,
                        accessToken: user.accessToken,
                        GitHub: "GitHub",
                        school: "",
                        college: "",
                        work: "",
                        from: "",
                        intro: "",
                        bytime: serverTimestamp(),
                    });

                    const userPreferencesRef = doc(db, 'UserPreferences', currentUser.uid);
                    await setDoc(userPreferencesRef, { theme: "light" });

                    // console.log("New user document added:");

                } catch (error) {
                    console.error("Error adding the user document:", error);
                }
            } else {
                // A document with the same UID already exists
            }

        } catch (error) {
            // Handle Errors here.
            const errorCode = error.code;
            const errorMessage = error.message;

            // If the error provides additional email information:
            const email = error.email;

            // You can also get the AuthCredential type used for the error, if available.
            const credential = OAuthProvider.credentialFromError(error);

            console.error('Google Authentication Error:', errorCode, errorMessage);
        }
    };


    const HandleGitHubAuth = async () => {
        try {
            const result = await signInWithPopup(auth, providerGit);
            const credential = GithubAuthProvider.credentialFromResult(result);
            const token = credential.accessToken;
            const user = result.user;
            // console.log(user);
            const colRef = collection(db, "users");
            const userQuery = query(colRef, where("uid", "==", currentUser.uid));
            const querySnapshot = await getDocs(userQuery);

            const userPreferencesRef = doc(db, 'UserPreferences', currentUser.uid);
            await setDoc(userPreferencesRef, { theme: "light" });

            if (querySnapshot.empty) {
                try {
                    await addDoc(colRef, {
                        uid: user.uid,
                        name: user.displayName,
                        email: user.email,
                        PhotoUrl: user.photoURL,
                        accessToken: user.accessToken,
                        GitHub: "GitHub",
                        school: "",
                        college: "",
                        work: "",
                        from: "",
                        intro: "",
                        bytime: serverTimestamp(),
                    });
                    // console.log("New user document added:");

                } catch (error) {
                    // console.error("Error adding the user document:", error);
                }
            } else {
                // A document with the same UID already exists
            }


        } catch (error) {
            // Handle Errors here.
            const errorCode = error.code;
            const errorMessage = error.message;
            const email = error.email;

            const credential = GithubAuthProvider.credentialFromError(error);
        }
    };

    return (
        <div className='login-main'>
            <div className="login-div">
                <div>
                    <div className='logo-div'>
                        <h4 style={{ marginBottom: "1rem" }}> <img src={logo} style={{ width: "45px" }} alt="" className='me-2' /> Messenger</h4>
                    </div>

                    <input type="email" placeholder='Email' className='login-input' onChange={(e) => setEmail(e.target.value)}
                        value={email} />
                    <input type="password" placeholder='Password' className='login-input' onChange={(e) => setPass(e.target.value)}
                        value={password}
                        onKeyDown={handleKeyDown} />

                    <div className="" id="error-alert" ></div>

                    <motion.div
                        initial={{ scale: 1 }}
                        transition={{ duration: 0.5, type: "spring" }}
                        // animate={{ scale: 1.5 }}
                        whileTap={{ scale: 0.97 }}
                        className="login-btn" onClick={login} >
                        {loginloading ?
                            <CircularProgress style={{ color: "white", width: "20px", height: "20px", margin: "2px 0" }} />
                            :
                            "Login"
                        }
                    </motion.div>
                    <hr />
                    <div className='google-icon'>
                        Don't have an account ? <a href="https://ajayanandrao.github.io/VChat/" target='blank' className='alink'> Sing UP</a>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Login