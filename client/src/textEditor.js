import React, { useCallback, useEffect, useState } from 'react';
import Quill from 'quill';
import "quill/dist/quill.snow.css";
import { io } from 'socket.io-client';

const TOOLBAR_OPTIONS = [
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    [{ font: [] }],
    [{ list: "ordered" }, { list: "bullet" }],
    ["bold", "italic", "underline"],
    [{ color: [] }, { background: [] }],
    [{ script: "sub" }, { script: "super" }],
    [{ align: [] }],
    ["image", "blockquote", "code-block"],
    ["clean"],
]

export default function TextEditor() {
    const [socket, setSocket] = useState()
    const [quill, setQuill] = useState() //To track the state of quill

    //Connecting to socket
    useEffect(() => {
        const s = io('http://localhost:3001')
        setSocket(s)

        return () => {
            s.disconnect()
        }
    }, [])

    //Emits event when changes are made on local machine
    useEffect(() => {
        if (socket == null || quill == null) return
        const handler = (delta, oldDelta, source) => {
            if (source !== "user") return  //makes sure that only user can set off changes
            socket.emit("send-changes", delta) //emits this to our server 
        }
        quill.on('text-change', handler)
        return () => {
            quill.off('text-change', handler)
        }
    }, [socket, quill])

    //Receives the events emitted elsewhere
    useEffect(() => {
        if (socket == null || quill == null) return
        const handler = (delta) => {
            quill.updateContents(delta)
        }
        socket.on('receive-changes', handler)
        return () => {
            socket.off('receive-change', handler)
        }
    }, [socket, quill])

    const wrapperRef = useCallback(wrapper => {
        if (wrapper == null) return
        wrapper.innerHTML = ""
        const editor = document.createElement('div')
        wrapper.append(editor)
        const q = new Quill(editor, {
            theme: "snow",
            modules: { toolbar: TOOLBAR_OPTIONS },
        })
        setQuill(q)
    }, [])

    return (
        <div className='container' ref={wrapperRef}></div>
    )
}