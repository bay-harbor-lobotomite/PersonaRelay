'use client';
import useSWR, { mutate } from "swr";
import useSWRMutation from "swr/mutation";
import { PERSONAS_BASE_URL } from "./constants";

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
