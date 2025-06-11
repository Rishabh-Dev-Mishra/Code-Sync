import React, { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import ACTIONS from "../Actions";
import Client from "../components/Client";
import Editor from "../components/Editor";
import { initSocket } from "../socket";
import { useLocation, useNavigate, Navigate, useParams } from "react-router-dom";

const EditorPage = () => {
    const socketRef = useRef(null);
    const codeRef = useRef("");
    const location = useLocation();
    const { roomId } = useParams();
    const reactNavigator = useNavigate();
    const [clients, setClients] = useState([]);
    const [output, setOutput] = useState("");
    const [language, setLanguage] = useState("cpp");
    const [userInput, setUserInput] = useState("");

    useEffect(() => {
        const init = async () => {
            socketRef.current = await initSocket();

            socketRef.current.on("connect_error", (err) => handleErrors(err));
            socketRef.current.on("connect_failed", (err) => handleErrors(err));

            function handleErrors(e) {
                toast.error("Socket connection failed. Redirecting...");
                reactNavigator("/");
            }

            socketRef.current.emit(ACTIONS.JOIN, {
                roomId,
                username: location.state?.username,
            });

            socketRef.current.on(ACTIONS.JOINED, ({ clients, username, socketId }) => {
                if (username !== location.state?.username) {
                    toast.success(`${username} joined the room.`);
                }
                setClients(clients);

                socketRef.current.emit(ACTIONS.SYNC_CODE, {
                    code: codeRef.current,
                    socketId,
                });
            });

            socketRef.current.on(ACTIONS.CODE_CHANGE, ({ code }) => {
                codeRef.current = code;
            });

            socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
                toast.success(`${username} left the room.`);
                setClients((prev) => prev.filter((client) => client.socketId !== socketId));
            });
        };

        init();

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current.off(ACTIONS.JOINED);
                socketRef.current.off(ACTIONS.DISCONNECTED);
                socketRef.current.off(ACTIONS.CODE_CHANGE);
            }
        };
    }, []);

    const executeCode = async () => {
        const options = {
            method: "POST",
            url: "https://judge0-ce.p.rapidapi.com/submissions",
            params: { base64_encoded: "false", wait: "true" },
            headers: {
                "content-type": "application/json",
                "X-RapidAPI-Key": "849c6b413bmshe4226e25e12af8dp1b55b0jsn613c9cf0e560",
                "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
            },
            data: {
                language_id: language === "cpp" ? 54 : 63,
                source_code: codeRef.current,
                stdin: userInput,
            },
        };

        try {
            const response = await axios.request(options);
            setOutput(response.data.stdout || response.data.stderr);
        } catch (error) {
            setOutput("Error executing code");
        }
    };

    async function copyRoomId() {
        try {
            await navigator.clipboard.writeText(roomId);
            toast.success("Room ID copied!");
        } catch (err) {
            toast.error("Could not copy Room ID");
        }
    }

    function leaveRoom() {
        reactNavigator("/");
    }

    if (!location.state) {
        return <Navigate to="/" />;
    }

    return (
        <div className="mainWrap">
            <div className="aside">
                <div className="asideInner">
                    <div className="logo">
                        <img className="logoImage" src="/code-sync.png" alt="logo" />
                    </div>
                    <h3>Connected</h3>
                    <div className="clientsList">
                        {clients.map((client) => (
                            <Client key={client.socketId} username={client.username} />
                        ))}
                    </div>
                </div>
                <button className="btn copyBtn" onClick={copyRoomId}>
                    Copy ROOM ID
                </button>
                <button className="btn leaveBtn" onClick={leaveRoom}>
                    Leave
                </button>
            </div>
            <div className="editorWrap">
                <Editor
                    socketRef={socketRef}
                    roomId={roomId}
                    onCodeChange={(code) => {
                        codeRef.current = code;
                    }}
                />
                <span className="bottomSection">
                    <select className="languageSelect" onChange={(e) => setLanguage(e.target.value)}>
                        <option value="cpp">C++</option>
                        <option value="javascript">JavaScript</option>
                    </select>
                    <button className="btn runBtn" onClick={executeCode}>
                        Run Code
                    </button>
                </span>

                {/* User Input Field */}
                <div className="inputSection">
                    <h3>Input</h3>
                    <textarea 
                        className="inputArea"
                        rows="4"
                        placeholder="Enter input here..."
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                    />
                </div>

                {/* Output Section */}
                <div className="outputWindow">
                    <h3>Output</h3>
                    <pre>{output}</pre>
                </div>
            </div>
        </div>
    );
};

export default EditorPage;
