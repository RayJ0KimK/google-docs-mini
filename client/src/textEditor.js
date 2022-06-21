import React, { useCallback, useEffect, useState } from 'react';
import Quill from 'quill';
import "quill/dist/quill.snow.css";
import { io } from 'socket.io-client';
import { useParams } from 'react-router-dom';
import { unwatchFile } from 'react-router-dom';

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
    const { id: documentId } = useParams() //renaming id to documentID
    const [socket, setSocket] = useState()
    const [quill, setQuill] = useState() //To track the state of quill
    console.log(documentId)

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

    //Prevent changes made to emitted by other documents
    useEffect(() => {
        if (socket == null || quill == null) return

        //This is only executed when load-document is called
        //What is var:document here ? 
        socket.once("load-document", document => {
            quill.setContents(document) //loads the document into text editor 
            quill.enable()
        })

        socket.emit('get-document', documentId) // telling the document of which document we're part of
    }, [socket, quill, documentId]) //What do you do with dockumentID ? 

    const wrapperRef = useCallback(wrapper => {
        if (wrapper == null) return
        wrapper.innerHTML = ""
        const editor = document.createElement('div')
        wrapper.append(editor)
        const q = new Quill(editor, {
            theme: "snow",
            modules: { toolbar: TOOLBAR_OPTIONS },
        })
        q.disable()
        q.setText('Loading...')
        setQuill(q)
    }, [])

    return (
        <div className='container' ref={wrapperRef}></div>
    )
}