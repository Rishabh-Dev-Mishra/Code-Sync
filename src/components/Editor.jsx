import React, { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import Codemirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/dracula.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/edit/closetag';
import 'codemirror/addon/edit/closebrackets';
import ACTIONS from '../Actions.js';

const Editor = forwardRef(({ socketRef, roomId, language, onCodeChange }, ref) => {
    const editorRef = useRef(null);
    const textareaRef = useRef(null); // Ref for the textarea

    const languageExtensionMap = {
        javascript: "js",
        python: "py",
        java: "java",
        cpp: "cpp",
        c: "c",
        html: "html",
        css: "css",
        json: "json",
        plaintext: "txt",
    };

    const handleSaveFile = () => {
        if (!editorRef.current) return;

        const code = editorRef.current.getValue();
        if (!code.trim()) {
            alert("Nothing to save");
            return;
        }

        const mimeMap = {
            javascript: "text/javascript",
            html: "text/html",
            css: "text/css",
            json: "application/json",
            cpp: "text/plain",
            c: "text/plain",
            python: "text/plain",
            java: "text/plain",
        };

        const safeLanguage = language || "plaintext";
        const extension = languageExtensionMap[safeLanguage] || "txt";
        const fileName = `codesync.${extension}`;

        const blob = new Blob([code], {
            type: mimeMap[language] || "text/plain",
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");

        a.href = url;
        a.download = fileName;
        a.click();

        URL.revokeObjectURL(url);
    };

    const handleCopyCode = () => {
        if (!editorRef.current) return;

        const code = editorRef.current.getValue();
        if (!code.trim()) {
            alert("Nothing to copy");
            return;
        }

        navigator.clipboard.writeText(code)
            .then(() => {
                alert("Code copied to clipboard");
            })
            .catch(() => {
                alert("Failed to copy code");
            });
    };

    useImperativeHandle(ref, () => {
        return {
            saveFile: handleSaveFile,
            copyCode: handleCopyCode,
        };
    });    

    useEffect(() => {
        if (!textareaRef.current) return;

        editorRef.current = Codemirror.fromTextArea(textareaRef.current, {
            mode: { name: 'javascript', json: true },
            theme: 'dracula',
            autoCloseTags: true,
            autoCloseBrackets: true,
            lineNumbers: true,
        });

        editorRef.current.on('change', (instance, changes) => {
            const { origin } = changes;
            const code = instance.getValue();
            onCodeChange(code);

            if (origin !== 'setValue' && socketRef.current) {
                socketRef.current.emit(ACTIONS.CODE_CHANGE, { roomId, code });
            }
        });

        return () => {
            editorRef.current.toTextArea(); // Clean up
        };
    }, []);

    useEffect(() => {
        if (!socketRef.current || !editorRef.current) return;

        const handleCodeChange = ({ code }) => {
            if (code !== editorRef.current.getValue()) {
                editorRef.current.setValue(code);
            }
        };

        socketRef.current.on(ACTIONS.CODE_CHANGE, handleCodeChange);

        return () => {
            socketRef.current.off(ACTIONS.CODE_CHANGE, handleCodeChange);
        };
    }, [socketRef, editorRef.current]);

    return <textarea ref={textareaRef} id="realtimeEditor"></textarea>;
});

export default Editor;
