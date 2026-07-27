"use client";

import { useState } from "react";

export default function JoinButton() {
    const [joined, setJoined] = useState(false);

    return (
        <button onClick={() => setJoined(!joined)}>
            {joined ? "Joined ✓" : "Join"}
        </button>
    );
}