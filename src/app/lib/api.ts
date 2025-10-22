// lib/api.ts
import axios from "axios";

export const api = axios.create({
  baseURL:
    "https://script.google.com/macros/s/AKfycby3m45-Mnpy_uHh5IHJbe9Uzilv5icEFHNK9SnzQu0yBkxEE-7LKeyylES8dcJYXBw0/exec",
  headers: {
    "Content-Type": "application/json",
  },
});
