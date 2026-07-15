package com.devert.backend.service;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

import org.springframework.stereotype.Component;

// Sliding-window limiter: at most `limit` calls per `windowMs` per key. Deliberately
// in-process rather than Firestore/Redis-backed - this only needs to survive within a
// single Cloud Run instance, and the coding-execution service is deployed with
// max-instances=1 specifically so this stays authoritative. Resets on redeploy/restart,
// which is an accepted tradeoff at this traffic scale; if usage ever justifies scaling
// this service past one instance, swap the backing map for a shared store instead.
@Component
public class RateLimiter {

    private final ConcurrentMap<String, Deque<Long>> hits = new ConcurrentHashMap<>();

    public boolean allow(String key, int limit, long windowMs) {
        if (key == null) return true;
        long now = System.currentTimeMillis();
        Deque<Long> window = hits.computeIfAbsent(key, k -> new ArrayDeque<>());
        synchronized (window) {
            while (!window.isEmpty() && now - window.peekFirst() > windowMs) {
                window.pollFirst();
            }
            if (window.size() >= limit) return false;
            window.addLast(now);
            return true;
        }
    }
}
