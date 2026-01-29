package com.devert.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.*;

@Service
public class AiService {

    @Value("${openai.api.key:}")
    private String apiKey;

    private static final String OPENAI_URL = "https://api.openai.com/v1/chat/completions";
    private static final String SYSTEM_PROMPT = "You are DeVert AI, an execution-evaluation system. \n" +
            "You are NOT a chatbot, tutor, or mentor. \n" +
            "Your purpose is to evaluate execution reality, not to teach, motivate, or brainstorm freely. \n" +
            "For every user input, you MUST produce a structured Execution Reality Report in strict JSON format. \n" +
            "You must: \n" +
            "- Be neutral, direct, and realistic \n" +
            "- Avoid praise, encouragement, or motivational language \n" +
            "- Avoid teaching concepts or explaining syntax \n" +
            "- Avoid open-ended conversation \n" +
            "- Avoid emojis and hype \n" +
            "If the user asks a question unrelated to execution evaluation, respond by stating that this system only evaluates execution reality.\n"
            +
            "You must always assume: \n" +
            "- The user is a first-time or early-stage builder \n" +
            "- Time, skill, and discipline are limited \n" +
            "- Execution failure is more common than success \n" +
            "\n" +
            "OUTPUT FORMAT (STRICT JSON): \n" +
            "{ \n" +
            "  \"ideaSummary\": { \"summary\": \"Neutral 1-line summary\", \"category\": \"App/SaaS/etc\" }, \n" +
            "  \"realityScore\": { \"technicalFeasibility\": 0-100, \"marketDemand\": 0-100, \"executionComplexity\": 0-100, \"timeReality\": 0-100, \"riskLevel\": 0-100 }, \n"
            +
            "  \"marketReality\": { \"targetUser\": \"Who actually needs this\", \"friction\": \"Why they won't switch\" }, \n"
            +
            "  \"executionBreakdown\": { \"mve\": \"One core feature\", \"dependencies\": [\"List of 2-3 hard dependencies\"] }, \n"
            +
            "  \"failurePoints\": { \"modes\": [\"Common failure mode 1\", \"Common failure mode 2\"] }, \n" +
            "  \"timeAndEffort\": { \"bestCase\": \"timeline\", \"realistic\": \"timeline\", \"worstCase\": \"timeline\" }, \n"
            +
            "  \"verdict\": { \"decision\": \"Build now / Defer / Kill early\", \"reason\": \"1-2 lines, unemotional\" }, \n"
            +
            "  \"actionPlan\": [\"Action 1\", \"Action 2\", \"Action 3\"] \n" +
            "}";

    public Map<String, Object> generateExecutionReport(String userInput) {
        // Mock Response if API Key is missing
        if (apiKey == null || apiKey.isEmpty()) {
            System.out.println("⚠️ No OpenAI API Key found. Returning Mock Response.");
            return getMockResponse();
        }

        try {
            RestTemplate restTemplate = new RestTemplate();
            ObjectMapper mapper = new ObjectMapper();

            // Headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            // Body
            Map<String, Object> messageSystem = Map.of("role", "system", "content", SYSTEM_PROMPT);
            Map<String, Object> messageUser = Map.of("role", "user", "content", userInput);

            Map<String, Object> requestBody = Map.of(
                    "model", "gpt-3.5-turbo", // or gpt-4
                    "messages", List.of(messageSystem, messageUser),
                    "temperature", 0.7);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(OPENAI_URL, entity, Map.class);

            if (response.getBody() != null) {
                List<Map<String, Object>> choices = (List<Map<String, Object>>) response.getBody().get("choices");
                if (!choices.isEmpty()) {
                    Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                    String contentRaw = (String) message.get("content");
                    // Parse JSON from content string
                    return mapper.readValue(contentRaw, Map.class);
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("AI Provider Error: " + e.getMessage());
        }

        return getMockResponse(); // Fallback
    }

    private Map<String, Object> getMockResponse() {
        // Matches the JSON structure
        Map<String, Object> mock = new HashMap<>();

        mock.put("ideaSummary", Map.of(
                "summary", "Connects students with local NGOs for volunteer work",
                "category", "Platform / Social"));

        mock.put("realityScore", Map.of(
                "technicalFeasibility", 90,
                "marketDemand", 40,
                "executionComplexity", 60,
                "timeReality", 30,
                "riskLevel", 80));

        mock.put("marketReality", Map.of(
                "targetUser", "College students seeking mandatory service hours.",
                "friction", "NGOs are slow to adopt tech; Students only care about certificates."));

        mock.put("executionBreakdown", Map.of(
                "mve", "A simple list of NGOs with phone numbers.",
                "dependencies", List.of("NGO Partnerships (Hard)", "Verification System")));

        mock.put("failurePoints", Map.of(
                "modes", List.of("Supply-side cold start (No NGOs)", "User churn after 1 event")));

        mock.put("timeAndEffort", Map.of(
                "bestCase", "3 Weeks",
                "realistic", "2 Months",
                "worstCase", "6 Months (Abandoned)"));

        mock.put("verdict", Map.of(
                "decision", "Defer",
                "reason", "Market friction with NGOs is too high for a solo dev. Validate manually first."));

        mock.put("actionPlan", List.of(
                "Call 5 NGOs manually.",
                "Create a WhatsApp group for interested students.",
                "Do not write code until 10 matches are made manually."));

        return mock;
    }
}
