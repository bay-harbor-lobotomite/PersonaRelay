'use client';
import useSWR, { mutate } from "swr";
import useSWRMutation from "swr/mutation";
import { MESSAGES_BASE_URL, PERSONAS_BASE_URL, SCHEDULING_BASE_URL } from "./constants";

const fetcher = (...args: [RequestInfo, RequestInit?]) => fetch(...args).then(res => res.json());
export const authedFetcher = (url: string) => {
    const token = localStorage.getItem("accessToken");
    return fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    }).then(res => res.json()).catch(err => {
        console.error("Error fetching data:", err)
        return err
    });
};

export const usePersonas = () => {
    const { data, error, isLoading } = useSWR(PERSONAS_BASE_URL, authedFetcher)
    const addPersona = async (newPersona: object) => {
        const token = localStorage.getItem("accessToken");

        const response = await fetch(PERSONAS_BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(newPersona),
        });

        if (!response.ok) {
            throw new Error("Failed to add persona");
        }
        console.log(await response.json());
        // Revalidate the cache
        await mutate(PERSONAS_BASE_URL);
    };

    return {
        personas: data,
        isLoading,
        isError: error,
        addPersona,
    };
}
export const useMessages = (selectedPersona: string) => {
    // add the selectedPersona as a query parameter to the URL
    const MESSAGES_BASE_URL_WITH_PERSONA = `${MESSAGES_BASE_URL}?persona_name=${selectedPersona}`;

    const { data, error, isLoading } = useSWR(MESSAGES_BASE_URL_WITH_PERSONA ,authedFetcher)

    return {
        messages: data,
        isLoading,
        isError: error,
    };
}

export const usePersona = (id?: string) => {
    const shouldFetch = Boolean(id); // prevents fetch when id is undefined/null

    const { data, error, isLoading } = useSWR(
        shouldFetch ? `${PERSONAS_BASE_URL}/${id}` : null,
        authedFetcher
    );

    return {
        persona: data,
        isLoading,
        isError: error,
    };
};

    

export async function addNewPersona(url: string, { arg }: { arg: string }) {
    await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${arg}`
        }
    })
}

export async function sendNostrPost(url: string, msg: string){
    console.log(msg)
    console.log(typeof msg)
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem("accessToken")}` },
      body: JSON.stringify({ content: msg }),
    });
    const data = await response.json()
    return data
}
export async function sendSamplePost(url: string, sample_post: string){
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem("accessToken")}` },
      body: JSON.stringify({ sample_post: sample_post }),
    });
    const data = await response.json()
    return data
}

export const schedulePostOnBackend = async (messageId: string, startDate: Date) => {
    try {
        const response = await fetch(`${SCHEDULING_BASE_URL}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem("accessToken")}` },
            body: JSON.stringify({ message_id: messageId, start_date: startDate.toISOString() }),
        });
        if (!response.ok) throw new Error('Failed to schedule');
        return await response.json();
    } catch (error) {
        console.error("Scheduling failed:", error);
        return null;
    }
};

export const unschedulePostOnBackend = async (taskId: string) => {
    try {
        const response = await fetch(`${SCHEDULING_BASE_URL}/${taskId}`, { 
            method: 'DELETE',
            headers: {'Authorization': `Bearer ${localStorage.getItem("accessToken")}` },
         });
        if (!response.ok) throw new Error('Failed to unschedule');
        return await response.json();
    } catch (error) {
        console.error("Unscheduling failed:", error);
    }
};