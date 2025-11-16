import { GoogleGenAI, Modality, Part } from "@google/genai";
import { GeneratedPart, ImageData } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export type BlogImageStyle = 'realistic' | 'watercolor' | 'illustration' | 'webtoon';

export const translateToEnglish = async (text: string): Promise<string> => {
    if (!text.trim()) {
        return "";
    }
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Translate the following Korean text to English. Respond with only the translated text, without any introductory phrases or explanations:\n\n"${text}"`,
            config: {
                temperature: 0.1,
            }
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error translating text:", error);
        // Fallback to original text if translation fails
        return text;
    }
};


export const editImage = async (
    originalImage: ImageData,
    prompt: string,
    synthesisImages: ImageData[]
): Promise<GeneratedPart[]> => {
    try {
        const originalImagePart = {
            inlineData: {
                mimeType: originalImage.mimeType,
                data: originalImage.data,
            },
        };

        const synthesisImageParts = synthesisImages.map(img => ({
            inlineData: {
                mimeType: img.mimeType,
                data: img.data,
            },
        }));
        
        const textPart = { text: prompt };

        // For synthesis, the order is [base, source, source..., prompt]
        // For primary edits, the order is [base, prompt]
        const parts: Part[] = [originalImagePart, ...synthesisImageParts, textPart];

        // The 'gemini-2.5-flash-image' model only supports Modality.IMAGE in the response.
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        const responseParts = response.candidates?.[0]?.content?.parts;

        if (!responseParts) {
            return [{ text: "No content generated." }];
        }

        const generatedParts = responseParts.reduce<GeneratedPart[]>((acc, part) => {
            if (part.text) {
                acc.push({ text: part.text });
            } else if (part.inlineData && part.inlineData.mimeType) {
                acc.push({
                    inlineData: {
                        id: crypto.randomUUID(),
                        mimeType: part.inlineData.mimeType,
                        data: part.inlineData.data,
                    },
                });
            }
            return acc;
        }, []);

        return generatedParts.length > 0 ? generatedParts : [{ text: "No content generated." }];
    } catch (error) {
        console.error("Error editing image:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return [{ text: `An error occurred: ${errorMessage}` }];
    }
};

/**
 * Fills the transparent area of an image based on a user prompt.
 */
export const inpaintImage = async (
    maskedImage: ImageData,
    userPrompt: string
): Promise<GeneratedPart[]> => {
    try {
        const imagePart: Part = {
            inlineData: {
                mimeType: maskedImage.mimeType,
                data: maskedImage.data,
            },
        };

        const englishUserPrompt = await translateToEnglish(userPrompt);

        const finalPrompt = `[CRITICAL MISSION: PRECISION INPAINTING]

Your only task is to fill the transparent area (where alpha channel is 0) of the provided image.

[ABSOLUTE RULE]
You MUST fill the ENTIRE transparent area completely. The original content inside this area must be 100% replaced. Do not leave any part of the original content.

[PRIMARY OBJECTIVE]
Your goal is to perform a seamless "content-aware fill". This means you must meticulously analyze the pixels and textures surrounding the transparent area and continue them into the erased region. Reconstruct the background (e.g., wallpaper, a desk, a wall) that would logically be behind the removed object.

[USER'S GUIDANCE]
The user has provided the following instruction: "${englishUserPrompt}"
- If the user asks to remove something, follow the PRIMARY OBJECTIVE.
- If the user asks to add something specific, fill the area with that object, making sure it blends realistically with the lighting and surroundings.

Execute now. Do not modify any part of the image outside the transparent area.`;
        const textPart: Part = { text: finalPrompt };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        const responseParts = response.candidates?.[0]?.content?.parts;

        if (!responseParts) {
            return [{ text: "No content generated." }];
        }

        const generatedParts = responseParts.reduce<GeneratedPart[]>((acc, part) => {
            if (part.text) {
                acc.push({ text: part.text });
            } else if (part.inlineData && part.inlineData.mimeType) {
                acc.push({
                    inlineData: {
                        id: crypto.randomUUID(),
                        mimeType: part.inlineData.mimeType,
                        data: part.inlineData.data,
                    },
                });
            }
            return acc;
        }, []);

        return generatedParts.length > 0 ? generatedParts : [{ text: "No content generated." }];
    } catch (error) {
        console.error("Error inpainting image:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return [{ text: `An error occurred: ${errorMessage}` }];
    }
};

export const suggestCompositionPrompt = async (
    originalImage: ImageData,
    synthesisImages: ImageData[],
    isBackgroundEmpty: boolean,
    aspectRatio: 'original' | '1:1' | '16:9' | '9:16' | '4:3' | '3:4'
): Promise<string> => {
    try {
        const imageParts: Part[] = [originalImage, ...synthesisImages].map(img => ({
            inlineData: {
                mimeType: img.mimeType,
                data: img.data,
            },
        }));
        
        const backgroundStatus = isBackgroundEmpty
            ? "NO_BACKGROUND"
            : "HAS_BACKGROUND";
        
        const aspectRatioInstruction = aspectRatio !== 'original'
            ? `3.  **Generate Part C (Aspect Ratio) - MANDATORY**: You MUST complete the sentence with a phrase that commands the AI to expand the scene to a **${aspectRatio}** ratio without cropping.
    - **Example**: "...중세 시대의 성으로 바꿔주세요. 그리고 전체 장면을 16:9 비율로 확장하여, 성 주변의 풍경을 더 보여주세요."`
            : '';
        
        const finalCheckInstruction = aspectRatio !== 'original'
            ? `-   Does your sentence have Part A, B, and C?`
            : `-   Does your sentence have both an action part and a background part?`;

        const prompt = `
[YOUR MISSION]
Your mission is to generate ONE creative Korean sentence suggesting how to combine the provided images.

[BACKGROUND CONTEXT]
-   **Background Status**: ${backgroundStatus}
-   This status is CRITICAL. Your entire response depends on it.

[STEP-BY-STEP INSTRUCTIONS]
1.  **Generate Part A (The Action)**: First, describe the core action of combining the images in Korean. (e.g., "여성에게 선글라스를 씌우고", "인물에게 갑옷을 입히고").
2.  **Generate Part B (The Background) - MANDATORY**: Second, you MUST complete the sentence by describing the background, strictly following the rule for the given 'Background Status'.
${aspectRatioInstruction}

[RULES FOR PART B]
-   **If Status is 'NO_BACKGROUND'**: You MUST invent a new, interesting background that fits the action in Part A. Your main task is to be creative here.
    -   **Example**: (Action: put sunglasses on woman) -> (Full Sentence): "여성에게 선글라스를 씌우고, 햇살 좋은 캘리포니아 해변에 서 있는 모습으로 만들어 주세요."
-   **If Status is 'HAS_BACKGROUND'**: You MUST suggest TRANSFORMING the existing background to create a cohesive new scene. Do NOT just say "blend it". Be creative.
    -   **Example**: (Action: put armor on a person in an office) -> (Full Sentence): "인물에게 갑옷을 입히고, 사무실 배경을 중세 시대의 성으로 바꿔주세요."

[FINAL CHECK]
${finalCheckInstruction}
-   Did you follow the correct rule for the given Background Status?
-   Is the output ONLY the single Korean sentence?

Now, generate the sentence.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [...imageParts, { text: prompt }] },
            config: {
                temperature: 0.7,
            }
        });

        return response.text.trim();
    } catch (error) {
        console.error("Error suggesting composition prompt:", error);
        throw new Error("Failed to get a suggestion from the AI.");
    }
};

export type ImageCategory = 'default' | 'realistic' | 'logo' | 'minimalist' | 'food' | 'vector' | 'watercolor' | 'webtoon' | 'sumi-e';

export const suggestOriginalImagePrompt = async (idea: string, category: ImageCategory): Promise<string> => {
    try {
        let systemPrompt = '';
        const baseInstructions = `[OUTPUT FORMAT]
- **Language**: MUST be in KOREAN.
- **Style**: Use vivid, specific descriptions to paint a visually rich scene.
- **Response Format**: Do NOT include any extra explanations (like "Of course, here is a suggestion:"). The response must be only the generated prompt sentence, ready for the user to copy and use.
- **Ethnicity Rule**: If the prompt you generate includes a person, you MUST specify them as Korean (e.g., "한국인 여성", "젊은 한국인 남성") unless the user's idea explicitly requests a different ethnicity.`;

        switch(category) {
            case 'realistic':
                systemPrompt = `[MISSION]
You are a world-class photographer and prompt engineer. Given a user's simple idea, you must generate a highly detailed and professional photography prompt in KOREAN, following the 'Realistic Photo Template' structure below. Describe every element specifically to paint a complete scene.

[REALISTIC PHOTO TEMPLATE]
A realistic [Shot Type] of [Subject], [Action or Expression], in [Environment]. The scene is lit with [Lighting Description], creating a [Mood/Atmosphere]. Shot on a [Camera/Lens Details], highlighting [Key Textures and Details].

[USER IDEA]
"${idea}"

${baseInstructions}`;
                break;
            case 'food':
                systemPrompt = `[MISSION]
You are a top food photographer. Based on the user's idea, generate a mouth-watering, highly detailed food photography prompt in KOREAN.

[FOOD PHOTO TEMPLATE]
Dramatic close-up shot of [Food], [Cooked State]. Placed in [Setting/Plating], with [Specific Ingredient] emphasized. Lit with [Lighting Style] to accentuate [Texture]. Shot on a professional DSLR, macro lens.

[USER IDEA]
"${idea}"

${baseInstructions}`;
                break;
            case 'watercolor':
                systemPrompt = `[MISSION]
You are a watercolor artist. Based on the user's idea, generate a soft and emotional watercolor painting prompt in KOREAN.

[WATERCOLOR TEMPLATE]
A delicate watercolor painting of [Subject], [Style]. Soft [Colors] bleed onto the paper. Wet-on-wet technique, loose and expressive brushstrokes. Textured watercolor paper background.

[USER IDEA]
"${idea}"

${baseInstructions}`;
                break;
            case 'vector':
                systemPrompt = `[MISSION]
You are a professional vector illustrator. Based on the user's idea, generate a clean and modern flat vector illustration prompt in KOREAN.

[VECTOR ILLUSTRATION TEMPLATE]
A flat vector illustration of [Subject], [Style]. Using [Key Features] and a limited [Color Palette]. Clean lines, geometric shapes, no shadows. Adobe Illustrator style.

[USER IDEA]
"${idea}"

${baseInstructions}`;
                break;
            case 'logo':
                systemPrompt = `[MISSION]
You are a branding expert and logo designer. Based on the user's idea, create a modern and sleek logo design prompt in KOREAN, following the 'Logo Design Template' below. You must clearly instruct the text rendering.

[LOGO DESIGN TEMPLATE]
Create a [Image Type] for [Brand/Concept]. The text "[[Text to Render]]" should be displayed in a [Font Style]. The design should be [Style Description], using a [Color Scheme].

[USER IDEA]
"${idea}"

${baseInstructions}`;
                break;
            case 'minimalist':
                systemPrompt = `[MISSION]
You are a minimalist design expert. Based on the user's idea, generate a sleek minimalist design prompt in KOREAN that makes strong use of negative space.

[MINIMALIST DESIGN TEMPLATE]
A minimalist composition with a single [Subject] placed in the [bottom right/top left/etc.] of the frame. The background is a vast, empty [Color] canvas, creating significant negative space. Soft, subtle lighting.

[USER IDEA]
"${idea}"

${baseInstructions}`;
                break;
            case 'webtoon':
                systemPrompt = `[MISSION]
You are a hit webtoon artist. Based on the user's idea, you must generate a dynamic and expressive webtoon panel prompt in KOREAN.

[WEBTOON PANEL TEMPLATE]
A full-body shot of [Character] in a [Dynamic Pose], with a [Specific, Exaggerated Facial Expression]. The scene is rendered in a clean, digital webtoon style with [Bold/Thin] line art and simple [Cell/Gradient] shading. The background is a [Simple Environment or Speed Lines] to emphasize the action/emotion.

[USER IDEA]
"${idea}"

${baseInstructions}`;
                break;
            case 'sumi-e':
                systemPrompt = `[MISSION]
You are a master of traditional Korean ink wash painting (수묵화), channeling the spirit of artists like Kim Hong-do and Shin Yun-bok. Based on the user's idea, generate an evocative and artistic prompt in KOREAN that captures the essence of this style.

[KOREAN INK WASH PAINTING TEMPLATE]
A traditional Korean ink wash painting (수묵화) of [Subject], [Action/Setting]. Executed with bold, expressive brushstrokes and varying ink tones (농담). The composition masterfully uses negative space (여백의 미) to create a sense of harmony and focus. Painted on traditional hanji paper, capturing its subtle texture.

[USER IDEA]
"${idea}"

${baseInstructions}`;
                break;
            case 'default':
            default:
                systemPrompt = `[MISSION]
You are a creative prompt generation expert. Given a user's simple idea, you must write a detailed and creative prompt in KOREAN that an AI image generation model (like Imagen) can easily understand to produce a rich result.

[USER IDEA]
"${idea}"

[EXAMPLE]
- (User Idea: a cat flying in space) -> "Photorealistic style, a cute baby cat wearing a spacesuit is floating against the backdrop of the Milky Way. Planets and stars twinkle in the background, the reflection of Earth is visible on the cat's helmet, cinematic lighting, dramatic composition, 8K, high definition."

${baseInstructions}`;
                break;
        }


        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: systemPrompt,
            config: {
                temperature: 0.8,
            }
        });

        return response.text.trim();
    } catch (error) {
        console.error("Error suggesting original image prompt:", error);
        throw new Error("Failed to get a prompt suggestion from the AI.");
    }
};

// ✅ PythonAnywhere 백엔드를 사용하는 이미지 생성 함수로 변경
export const generateImage = async (
  prompt: string,
  aspectRatio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4' = '1:1',
  numberOfImages: number = 1   // 현재는 1장만 생성하지만 타입 호환을 위해 유지
): Promise<ImageData[]> => {
  try {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
      throw new Error("Prompt is empty.");
    }

    // 필요하다면 translateToEnglish 사용 가능 (우선 한글 그대로도 잘 됩니다)
    // const englishPrompt = await translateToEnglish(trimmedPrompt) || trimmedPrompt;

    const res = await fetch("https://kangsik.pythonanywhere.com/canvas/generate-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: trimmedPrompt,
        aspect_ratio: aspectRatio,
        size: "1K",
      }),
    });

export const generateImage = async (
  prompt: string,
  aspectRatio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4' = '1:1',
  numberOfImages: number = 1
): Promise<ImageData[]> => {
  try {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
      throw new Error("Prompt is empty.");
    }

    const res = await fetch("https://kangsik.pythonanywhere.com/canvas/generate-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: trimmedPrompt,
        aspect_ratio: aspectRatio,
        size: "1K",
      }),
    });

    let data: any = null;
    try {
      data = await res.json();
    } catch {
      // JSON 파싱 실패 시는 그대로 진행
    }

    if (!res.ok || !data || data.ok === false) {
      const backendMessage = data && data.error ? data.error : "";
      const msg = backendMessage || `HTTP error ${res.status}`;
      throw new Error(msg);
    }

    if (!data.image_base64) {
      throw new Error("Image generation failed (no image_base64).");
    }

    const image: ImageData = {
      id: crypto.randomUUID(),
      mimeType: "image/jpeg",
      data: data.image_base64,
    };

    return [image];
  } catch (error) {
    console.error("Error generating image via backend:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to generate image (backend): ${errorMessage}`);
  }
};


    // 백엔드에서 JPEG base64로 반환하므로 mimeType은 image/jpeg
    const image: ImageData = {
      id: crypto.randomUUID(),
      mimeType: "image/jpeg",
      data: data.image_base64, // 나머지 코드에서 inlineData.data 로 사용 가능
    };

    // 기존 시그니처를 유지하기 위해 배열로 반환
    return [image];
  } catch (error) {
    console.error("Error generating image via backend:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to generate image (backend): ${errorMessage}`);
  }
};


/**
 * Generic function to generate mixed text and image content from a text prompt and an optional base image.
 */
export const generateTextAndImages = async (
    prompt: string,
    image: ImageData | null = null,
    modalities: Modality[] = [Modality.IMAGE, Modality.TEXT],
    model = 'gemini-2.5-flash-image'
): Promise<GeneratedPart[]> => {
    try {
        const textPart: Part = { text: prompt };
        const parts: Part[] = [];

        if (image) {
            parts.push({
                inlineData: {
                    mimeType: image.mimeType,
                    data: image.data,
                },
            });
        }
        parts.push(textPart);

        const config: { responseModalities?: Modality[] } = {};
        if (model === 'gemini-2.5-flash-image') {
            config.responseModalities = modalities;
        }

        const response = await ai.models.generateContent({
            model,
            contents: { parts },
            config,
        });

        const responseParts = response.candidates?.[0]?.content?.parts;

        if (!responseParts) {
            return [{ text: "콘텐츠를 생성하지 못했습니다." }];
        }

        const generatedParts = responseParts.reduce<GeneratedPart[]>((acc, part) => {
            if (part.text) {
                acc.push({ text: part.text });
            } else if (part.inlineData && part.inlineData.mimeType) {
                acc.push({
                    inlineData: {
                        id: crypto.randomUUID(),
                        mimeType: part.inlineData.mimeType,
                        data: part.inlineData.data,
                    },
                });
            }
            return acc;
        }, []);

        return generatedParts.length > 0 ? generatedParts : [{ text: "생성된 콘텐츠가 없습니다." }];
    } catch (error) {
        console.error("Error generating text and images:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return [{ text: `오류가 발생했습니다: ${errorMessage}` }];
    }
};

/**
 * Generates an image with meridian lines and acupoints overlaid.
 */
export const visualizeAcupoint = async (
    image: ImageData,
    prompt: string
): Promise<GeneratedPart[]> => {
    try {
        const imagePart: Part = { inlineData: { mimeType: image.mimeType, data: image.data } };
        const userPrompt = `[USER REQUEST]
"${prompt}"`;

        const systemPrompt = `[YOUR MISSION: VISUALIZE ACUPOINTS AND MERIDIANS WITH SURGICAL PRECISION]

You are a master medical illustrator specializing in anatomical charts for Traditional Korean Medicine. Your task is to overlay graphics onto a user's photo with the highest degree of accuracy. This is not an artistic task; it is a technical, medical illustration task. **Precision is the absolute priority.**

[STEP-BY-STEP EXECUTION PROTOCOL]
1.  **ANALYZE THE PHOTO**: First, meticulously identify the body part shown. Then, locate key **anatomical landmarks** visible in the photo (e.g., specific bones, joints, tendons, depressions between muscles). Your entire drawing will be based on these landmarks.

2.  **DECODE THE USER REQUEST**: Identify the specific acupoint(s) (경혈) and/or meridian(s) (경락) the user wants to see. **Crucially, if the user only mentions an acupoint and does not explicitly ask for a meridian (경락), you MUST NOT draw the meridian line.**

3.  **PRECISE PLACEMENT (CRITICAL)**:
    *   **Acupoints (경혈)**: Locate the exact position of the requested acupoint relative to the anatomical landmarks you identified in Step 1. Use the principles of proportional measurement (cun) if applicable. For example, LI4 (Hegu) is located on the dorsum of the hand, between the 1st and 2nd metacarpal bones, at the midpoint of the 2nd metacarpal bone's radial border. You must find these bones in the photo to place the point correctly.
    *   **Meridians (경락)**: If requested, the path of the meridian line MUST precisely follow its course as depicted in official medical acupuncture charts, flowing in relation to the underlying anatomy (muscles, bones).

4.  **RENDER THE GRAPHICS (STRICT RULES)**:
    *   **Preserve Original Image**: The user's photo is the un-editable background. Only add the overlay.
    *   **Acupoint Style**:
        *   Mark the point with a small, clean, solid red dot.
        *   Label the point using **ONLY its standard English alphanumeric code (e.g., 'LI4', 'ST36')**.
        *   The label must be in a small, clean, white sans-serif font, placed **immediately next to the dot** without obscuring any important anatomical details. The label and dot must be clearly associated with each other.
        *   **ABSOLUTELY NO KOREAN (HANGUL) text.**
        *   Mark **ONLY the requested points**. Do not add others.
    *   **Meridian Style**:
        *   **Draw ONLY if explicitly requested**: You MUST draw the meridian line ONLY IF the user explicitly asks for it (e.g., "...경락을 그려주세요", "...경로를 보여주세요"). If the user only requests an acupoint, DO NOT draw the meridian.
        *   If drawing, use a thin, solid, semi-transparent blue line.
        *   The line must be smooth and follow the anatomical contours accurately.
        *   **DO NOT add any text labels to the meridian line itself.**

5.  **FINAL VERIFICATION (MANDATORY SELF-CORRECTION)**: Before outputting the final image, you MUST perform a rigorous self-check.
    *   **Anatomical Accuracy Check**: Review the placement of each requested acupoint. Is its location defensible according to standard medical acupuncture charts, relative to the specific anatomical landmarks (bones, tendons, depressions) visible in this specific photo? If there is any doubt, re-evaluate and adjust the position.
    *   **Label Proximity Check**: For every single red dot, is its corresponding alphanumeric label (e.g., 'LI20') placed **directly adjacent to it**? The association must be immediate and unambiguous. There should be no significant space between the dot and its label.
    *   **Rule Compliance Check**: Have I followed all rendering rules? Red dots for points, blue lines for meridians? Did I correctly follow the rule to *only* draw a meridian if explicitly requested?
    *   **Clarity Check**: Is the final image clear, professional, and easy to understand, resembling an illustration from a modern medical textbook?
If the answer to any of these questions is "no", you MUST correct the drawing before generating the output. A failure to adhere to these checks is a failure of the entire mission.

6.  **OUTPUT**: Your response MUST be ONLY the single, final, combined image.

Execute this mission with the precision of a surgeon.`;

        const parts: Part[] = [imagePart, {text: userPrompt}, {text: systemPrompt}];
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
        
        const responseParts = response.candidates?.[0]?.content?.parts;
        if (!responseParts) {
            return [{ text: "콘텐츠를 생성하지 못했습니다." }];
        }
        return responseParts.map(part => {
            if (part.text) return { text: part.text };
            if (part.inlineData) return { inlineData: { id: crypto.randomUUID(), ...part.inlineData } };
            return {};
        });
    } catch (error) {
        console.error("Error visualizing acupoint:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return [{ text: `오류가 발생했습니다: ${errorMessage}` }];
    }
};

/**
 * Suggests a prompt for visualizing acupoints on an image.
 */
export const suggestAcupointPrompt = async (image: ImageData): Promise<string> => {
    try {
        const imagePart: Part = { inlineData: { mimeType: image.mimeType, data: image.data } };
        
        const prompt = `[YOUR MISSION]
You are an expert in Traditional Korean Medicine. Your task is to analyze the provided image of a human body part and suggest a single, clear, and actionable KOREAN prompt for visualizing a major acupoint and its associated meridian on that body part. The generated prompt should be highly effective for an AI medical illustrator.

[RULES]
1.  **Analyze Image**: Identify the body part shown (e.g., hand, foot, arm).
2.  **Select Major Acupoint**: Choose a single, well-known, and clinically significant acupoint clearly visible on that body part.
3.  **Formulate Prompt**: Create one Korean sentence that is direct and technical.
    *   It MUST explicitly name the acupoint in Korean.
    *   It MUST include the acupoint's standard English alphanumeric code in parentheses, like (LI4). This is critical.
    *   It MUST request to mark the point AND draw its associated meridian line (경락).
4.  **Output Format**: The output must be ONLY the single Korean sentence. No explanations, no greetings.

[GOOD EXAMPLES]
*   (Image of a hand): "손등의 합곡혈(LI4) 위치를 정확히 표시하고, 수양명대장경의 경로를 그려주세요."
*   (Image of a foot): "발목 안쪽 태계혈(KI3) 위치를 표시하고, 족소음신경의 흐름을 보여주세요."
*   (Image of a forearm): "팔 안쪽 내관혈(PC6) 지점을 표시하고, 수궐음심포경 라인을 그려주세요."

[BAD EXAMPLES]
*   "손에 있는 경혈점을 보여줘." (Too vague)
*   "합곡혈을 예쁘게 그려주세요." (Not technical)
*   "수양명대장경을 그려주세요." (Doesn't ask for a specific point, which is less useful)

Now, analyze the provided image and generate the perfect, single-sentence Korean prompt.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, { text: prompt }] },
            config: {
                temperature: 0.7,
            }
        });

        return response.text.trim();
    } catch (error) {
        console.error("Error suggesting acupoint prompt:", error);
        throw new Error("Failed to get an acupoint prompt suggestion from the AI.");
    }
};


/**
 * Generates an image with bones overlaid.
 */
export const visualizeBones = async (
    image: ImageData,
    prompt: string
): Promise<GeneratedPart[]> => {
    try {
        const imagePart: Part = { inlineData: { mimeType: image.mimeType, data: image.data } };
        const userPrompt = `[USER REQUEST]
"${prompt}"`;

        const systemPrompt = `[YOUR MISSION: VISUALIZE SKELETAL STRUCTURE WITH ANATOMICAL ACCURACY]

You are an expert medical illustrator specializing in human anatomy and osteology. Your task is to accurately overlay a semi-transparent, artistically rendered drawing of the underlying bone structure onto a user's photograph. This is a technical illustration task where anatomical correctness is paramount.

[STEP-BY-STEP EXECUTION PROTOCOL]
1.  **ANALYZE THE PHOTO**: Meticulously identify the body part, the person's pose, and any visible anatomical landmarks (e.g., joints, prominent bone contours like knuckles or the olecranon process of the elbow). These landmarks are your guide for accurate placement.
2.  **DECODE THE USER REQUEST**: Determine which specific bone(s) the user wants to see. If they ask for "the bones in the hand," you must identify and draw all relevant carpals, metacarpals, and phalanges.
3.  **PRECISE PLACEMENT**: Based on your analysis, draw the requested bones in their correct anatomical position, size, and orientation *within* the user's photo. The drawing must align with the visible contours of the body.
4.  **RENDER THE GRAPHICS (STRICT RULES)**:
    *   **Style**: The bones MUST be rendered in a **white, semi-transparent style, resembling an X-ray or a medical textbook illustration.** The rendering should have some depth and shading to look realistic, not like a flat outline.
    *   **Preserve Original Image**: The user's photo is the background. Only add the bone overlay. Do not alter the original photo.
    *   **Labels**: If the user requests labels (e.g., "손목뼈를 그리고 이름을 표시해줘"), add clean, simple text labels in Korean next to the corresponding bones. Use arrows or leader lines if necessary for clarity. If no labels are requested, do not add any.
5.  **FINAL VERIFICATION (MANDATORY)**: Before outputting the image, perform a self-check.
    *   **Anatomical Accuracy Check**: Does the drawn skeletal structure align correctly with the visible body part and its pose? Are the bones correctly shaped and proportioned?
    *   **Clarity Check**: Is the final image clear, professional, and easy to understand?
    *   If the check fails, you must correct the drawing before generating the output.
6.  **OUTPUT**: Your response MUST be ONLY the single, final, combined image.

Execute this mission with the precision of an anatomy professor.`;

        const parts: Part[] = [imagePart, {text: userPrompt}, {text: systemPrompt}];
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
        
        const responseParts = response.candidates?.[0]?.content?.parts;
        if (!responseParts) {
            return [{ text: "콘텐츠를 생성하지 못했습니다." }];
        }
        return responseParts.map(part => {
            if (part.text) return { text: part.text };
            if (part.inlineData) return { inlineData: { id: crypto.randomUUID(), ...part.inlineData } };
            return {};
        });
    } catch (error) {
        console.error("Error visualizing bones:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return [{ text: `오류가 발생했습니다: ${errorMessage}` }];
    }
};

/**
 * Suggests a prompt for visualizing bones on an image.
 */
export const suggestBonePrompt = async (image: ImageData): Promise<string> => {
    try {
        const imagePart: Part = { inlineData: { mimeType: image.mimeType, data: image.data } };
        
        const prompt = `[YOUR MISSION]
You are an expert in human anatomy. Your task is to analyze the provided image of a human body part and suggest a single, clear, and actionable KOREAN prompt for visualizing the major bones within that part.

[RULES]
1.  **Analyze Image**: Identify the body part shown (e.g., hand, foot, elbow).
2.  **Select Major Bones**: Choose the most prominent and relevant bones visible in that area.
3.  **Formulate Prompt**: Create one Korean sentence that is direct and descriptive.
    *   It MUST name the key bones or bone groups in Korean.
    *   It MUST ask the AI to draw them.
4.  **Output Format**: The output must be ONLY the single Korean sentence.

[GOOD EXAMPLES]
*   (Image of a hand): "손 안에 있는 손허리뼈와 손가락뼈들을 그려주세요."
*   (Image of a foot): "발의 발목뼈와 발허리뼈 구조를 보여주세요."
*   (Image of an elbow): "팔꿈치의 위팔뼈, 노뼈, 자뼈의 관절 부위를 그려주세요."

Now, analyze the provided image and generate the perfect, single-sentence Korean prompt.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, { text: prompt }] },
            config: {
                temperature: 0.7,
            }
        });

        return response.text.trim();
    } catch (error) {
        console.error("Error suggesting bone prompt:", error);
        throw new Error("Failed to get a bone prompt suggestion from the AI.");
    }
};

/**
 * Generates an image with internal organs overlaid.
 */
export const visualizeOrgans = async (
    image: ImageData,
    prompt: string
): Promise<GeneratedPart[]> => {
    try {
        const imagePart: Part = { inlineData: { mimeType: image.mimeType, data: image.data } };
        const userPrompt = `[USER REQUEST]
"${prompt}"`;

        const systemPrompt = `[YOUR MISSION: VISUALIZE INTERNAL ORGANS FOR A MEDICAL TEXTBOOK]

You are an expert medical illustrator creating diagrams for a prestigious anatomy textbook. Your task is to overlay a precise, semi-transparent drawing of internal organs onto a user's photograph. **Anatomical accuracy, including position, size, and proportion, is the absolute, non-negotiable priority.**

[STEP-BY-STEP EXECUTION PROTOCOL]
1.  **ANALYZE & INFER LANDMARKS**: Meticulously analyze the user's photo. Identify external landmarks (navel, rib cage outline). CRITICALLY, you must also **infer the location of key internal skeletal landmarks** like the sternum, clavicles, and diaphragm to serve as your primary reference points for placement.

2.  **DECODE USER REQUEST**: Determine which specific organ(s) the user wants to see (e.g., heart, lungs, stomach, liver).

3.  **SURGICALLY PRECISE PLACEMENT (CRITICAL)**: Based on your inferred landmarks, draw the requested organs in their exact anatomical position, size, and orientation.
    *   **Example - Heart**: The heart is NOT perfectly central. It is located in the middle mediastinum, with approximately **two-thirds of its mass to the left of the body's midline**. Its base is superior, and its apex should point inferiorly and to the left.
    *   **Example - Lungs**: The lungs MUST be drawn to appear large, filling the majority of the thoracic cavity on either side of the heart. They should extend superiorly to just above the clavicles (the apex of the lung) and inferiorly to rest on the inferred diaphragm.
    *   **Example - Liver**: The liver should be placed primarily in the upper right quadrant of the abdomen, tucked just below the diaphragm.

4.  **RENDER THE GRAPHICS (STRICT RULES)**:
    *   **Style**: The organs MUST be rendered in a **white and grayscale, semi-transparent style, resembling an X-ray or CT scan overlay.** Use shading to give a sense of three-dimensional form. Use only shades of white and gray.
    *   **Content Focus**: You must **ONLY draw the requested internal organs**. Do **NOT** draw any bones (like ribs, spine, etc.). The focus is exclusively on the specified viscera.
    *   **Preserve Original Image**: The user's photo is the background. Only add the organ overlay.
    *   **Labels**: **ABSOLUTELY NO LABELS OR TEXT.**

5.  **FINAL VERIFICATION (MANDATORY SELF-CORRECTION)**: Before outputting the image, you MUST perform a rigorous self-check against these questions. If any answer is no, you MUST correct it.
    *   **Positional Accuracy Check**: Have I placed each organ according to its textbook anatomical location relative to the inferred sternum, midline, and diaphragm? (e.g., Is two-thirds of the heart on the left?)
    *   **Proportionality Check**: Are the organs sized correctly relative to the body and each other? (e.g., Are the lungs large enough to realistically fill the chest cavity around the heart?)
    *   **Style Check**: Is the rendering in the correct white/grayscale X-ray style?
    *   **Content Check**: Have I ensured that ONLY the requested organs are drawn, and NO bones are included?
    *   **No-Text Check**: Is the final image completely free of text?

6.  **OUTPUT**: Your response MUST be ONLY the single, final, combined image.

Execute this mission with the precision required for a surgical planning guide.`;

        const parts: Part[] = [imagePart, {text: userPrompt}, {text: systemPrompt}];
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
        
        const responseParts = response.candidates?.[0]?.content?.parts;
        if (!responseParts) {
            return [{ text: "콘텐츠를 생성하지 못했습니다." }];
        }
        return responseParts.map(part => {
            if (part.text) return { text: part.text };
            if (part.inlineData) return { inlineData: { id: crypto.randomUUID(), ...part.inlineData } };
            return {};
        });
    } catch (error) {
        console.error("Error visualizing organs:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return [{ text: `오류가 발생했습니다: ${errorMessage}` }];
    }
};

/**
 * Suggests a prompt for visualizing organs on an image.
 */
export const suggestOrganPrompt = async (image: ImageData): Promise<string> => {
    try {
        const imagePart: Part = { inlineData: { mimeType: image.mimeType, data: image.data } };
        
        const prompt = `[YOUR MISSION]
You are an expert in human anatomy. Your task is to analyze the provided image of a human torso (chest or abdomen) and suggest a single, clear, and actionable KOREAN prompt for visualizing the ajor internal organs within that part.

[RULES]
1.  **Analyze Image**: Identify if the main area is the chest or abdomen.
2.  **Select Major Organs**: Choose the most prominent and relevant organs for that area.
3.  **Formulate Prompt**: Create one Korean sentence that is direct and descriptive.
    *   It MUST name the key organs in Korean.
    *   It MUST ask the AI to draw them clearly.
4.  **Output Format**: The output must be ONLY the single Korean sentence.

[GOOD EXAMPLES]
*   (Image of a chest): "가슴 부위의 심장과 폐를 그려주세요."
*   (Image of an abdomen): "복부의 위, 간, 대장의 위치를 보여주세요."
*   (Image of upper abdomen): "상복부의 간과 쓸개의 모습을 그려주세요."

Now, analyze the provided image and generate the perfect, single-sentence Korean prompt.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, { text: prompt }] },
            config: {
                temperature: 0.7,
            }
        });

        return response.text.trim();
    } catch (error) {
        console.error("Error suggesting organ prompt:", error);
        throw new Error("Failed to get an organ prompt suggestion from the AI.");
    }
};

/**
 * Performs subtle, realistic photo retouching on an image based on a prompt.
 */
export const beautifyImage = async (
    image: ImageData,
    prompt: string
): Promise<GeneratedPart[]> => {
    try {
        const imagePart: Part = { inlineData: { mimeType: image.mimeType, data: image.data } };
        const userPrompt = `[USER REQUEST]
"${prompt}"`;

        const systemPrompt = `[YOUR MISSION: SUBTLE, PROFESSIONAL PHOTO RETOUCHING]

You are a high-end digital photo retoucher. Your task is to perform subtle, realistic edits on the user's photograph based on their request. The absolute highest priority is to **preserve the person's identity and natural appearance**. The final result must look like a real, unedited photograph, not an "AI" image.

[EXECUTION PROTOCOL]
1.  **Analyze Request**: Understand the user's specific editing instruction (e.g., "remove blemishes," "make hair fuller," "correct skin tone").
2.  **Execute with Subtlety**: Apply the requested change minimally and realistically.
    *   **Blemishes**: Remove pimples, small scars, or temporary skin imperfections. Do NOT remove permanent features like moles or birthmarks unless specifically asked.
    *   **Hair**: Adjust volume or stray hairs naturally. Do not create an artificial "helmet" look. The result must look like real hair.
    *   **Skin Tone**: Even out redness or discoloration subtly. Do not change the person's overall skin color. **Crucially, maintain natural skin texture.** Do not make it look like plastic or overly smooth.
    *   **Smile**: If asked to add a smile, it must be a very slight, natural-looking upturn of the lips. Avoid a wide, toothy, artificial grin. The person should still look like themselves.
    *   **Remove Glasses**: If asked to remove glasses, reconstruct the eyes and surrounding skin realistically, paying close attention to shadows and reflections that would no longer be there.
3.  **Preserve Identity**: Do NOT alter the fundamental structure of the person's face (eye shape and color, nose, mouth shape, jawline). The person in the output image MUST be instantly recognizable as the person in the input image.
4.  **Maintain Photo Quality**: The output must match the original photo's lighting, focus, grain, and overall quality. Do not "sharpen" or "enhance" the image unless asked.
5.  **Output**: Your response MUST be ONLY the single, final, edited image. Do not add text or any other elements. Do not change the background.

Execute this mission with the care and precision of a master portrait photographer.`;

        const parts: Part[] = [imagePart, {text: userPrompt}, {text: systemPrompt}];
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
        
        const responseParts = response.candidates?.[0]?.content?.parts;
        if (!responseParts) {
            return [{ text: "콘텐츠를 생성하지 못했습니다." }];
        }
        return responseParts.map(part => {
            if (part.text) return { text: part.text };
            if (part.inlineData) return { inlineData: { id: crypto.randomUUID(), ...part.inlineData } };
            return {};
        });
    } catch (error) {
        console.error("Error beautifying image:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return [{ text: `오류가 발생했습니다: ${errorMessage}` }];
    }
};

/**
 * Removes the background from an image, leaving only the main subject(s).
 */
export const removeBackground = async (
    image: ImageData
): Promise<GeneratedPart[]> => {
    try {
        const imagePart: Part = { inlineData: { mimeType: image.mimeType, data: image.data } };
        
        const prompt = `[YOUR MISSION: PROFESSIONAL BACKGROUND REMOVAL WITH SURGICAL PRECISION]

You are an expert image editor specializing in high-quality background removal. Your task is to analyze the provided image, identify the complete "foreground scene" (main subjects and any objects they are interacting with), and meticulously erase the background. The final output must be a clean PNG with a transparent background and perfectly sharp edges.

[STEP-BY-STEP EXECUTION PROTOCOL]
1.  **IDENTIFY THE CORE SUBJECT GROUP**: Analyze the image to identify the main person or people. Crucially, you must also include any objects they are directly touching, using, or are sitting on/at. This entire collection is the "Core Subject Group".
    *   **EXAMPLE**: In an image of a doctor at a desk examining a patient's hand, the "Core Subject Group" consists of the doctor, the desk, the chair they are sitting on, any instruments on the desk, and the patient's hand.
    *   **WHAT TO REMOVE**: Everything that is NOT part of this group is considered background and must be removed. This includes walls, bookshelves, windows, and other distant scenery.

2.  **PERFORM A RAZOR-SHARP MASKING**: Create a pixel-perfect mask around the identified Core Subject Group. The boundary between the subject group and the background must be perfectly clean and sharp, with no blurry edges, halos, or leftover background pixels. Pay obsessive attention to fine details like individual strands of hair and complex object edges.

3.  **COMPLETE BACKGROUND ERASURE**: Remove everything that is not part of the Core Subject Group.

4.  **OUTPUT FORMAT**: The final output MUST be a single PNG image. The area where the background was removed MUST be fully transparent (alpha channel = 0). Do not fill it with any color.

Execute this mission with the highest level of detail and accuracy. The final image should look like a perfectly cut-out sticker.`;
        
        const parts: Part[] = [imagePart, {text: prompt}];
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
        
        const responseParts = response.candidates?.[0]?.content?.parts;
        if (!responseParts) {
            return [{ text: "콘텐츠를 생성하지 못했습니다." }];
        }
        return responseParts.map(part => {
            if (part.text) return { text: part.text };
            if (part.inlineData) return { inlineData: { id: crypto.randomUUID(), ...part.inlineData } };
            return {};
        });
    } catch (error) {
        console.error("Error removing background:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return [{ text: `오류가 발생했습니다: ${errorMessage}` }];
    }
};

export const getTopicKeyword = async (text: string): Promise<string> => {
    if (!text.trim()) {
        return "image";
    }
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze the following text and extract a single, representative, URL-friendly keyword in English. The keyword should be one word, lowercase, and suitable for a filename. For example, if the text is "허리 통증을 앓는 30대 한국인 남성", the keyword should be "backpain". If the text is about dieting, the keyword should be "diet". Respond with only the single English keyword.\n\nText: "${text}"`,
            config: {
                temperature: 0.1,
            }
        });
        const keyword = response.text.trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
        return keyword || "image";
    } catch (error) {
        console.error("Error extracting keyword:", error);
        return "image";
    }
};

const getStyleDescription = (style: BlogImageStyle): string => {
    switch (style) {
        case 'realistic': return 'photorealistic, like a high-resolution photograph';
        case 'watercolor': return 'like a delicate and expressive watercolor painting';
        case 'illustration': return 'like a clean, modern vector illustration with bold colors';
        case 'webtoon': return 'in a dynamic and expressive digital webtoon style with clean lines';
        default: return 'in a standard digital art style';
    }
};

export const suggestBlogImagePrompts = async (
    blogText: string, 
    numberOfImages: number,
    style: BlogImageStyle
): Promise<string> => {
    try {
        const styleDescription = getStyleDescription(style);

        if (numberOfImages === 1) {
            const promptCreationResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `[YOUR MISSION]
You are an expert art director. Analyze the following Korean blog text and generate a single, concise, yet visually rich prompt in ENGLISH for an AI image generation model.

[RULES]
1.  **Analyze**: Deeply analyze the provided Korean text to extract the core theme, mood, and key visual elements.
2.  **Synthesize**: Create a powerful English prompt describing a single, coherent scene. The image should be created in a style that is **${styleDescription}**.
3.  **Ethnicity Rule**: If the scene involves people, you MUST describe them as being of Korean ethnicity (e.g., "a young Korean woman", "an elderly Korean man"), unless the blog text clearly implies a different ethnicity. This is a crucial instruction.
4.  **ABSOLUTE NO-TEXT RULE**: The final image MUST be purely visual. Your prompt MUST NOT contain any instructions to render text, letters, words, or characters of any language. For example, instead of asking for a sign with text, ask for a sign with a simple icon. This is a strict rule.
5.  **Output Format**: Respond ONLY with the generated English prompt. No introductions, no explanations.

[KOREAN BLOG TEXT]
---
${blogText}
---
`,
                config: { temperature: 0.5 }
            });
            return promptCreationResponse.text.trim();
        } else {
            const promptsCreationResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `[YOUR MISSION]
You are an expert art director specializing in creating diverse visual concepts from a single text. Your task is to analyze the following Korean blog text and generate ${numberOfImages} completely distinct and visually diverse image prompts in ENGLISH.

[ANALYSIS & DIVERSIFICATION STRATEGY]
1.  **Deconstruct**: Break the text into its core themes, key paragraphs, or narrative stages.
2.  **Conceptualize Diverse Scenes**: For each prompt, brainstorm a unique scene representing a different aspect. Do not just slightly alter the previous prompt. Consider changing scenery, subject, angle, or mood.
3.  **Write Prompts**: Write each prompt in rich, descriptive English. All prompts should describe a scene that fits a **${styleDescription}** style.

[CRITICAL RULES FOR ALL PROMPTS]
1.  **Ethnicity Rule**: If any scene involves people, you MUST describe them as being of Korean ethnicity (e.g., "a young Korean woman", "an elderly Korean man"), unless the blog text clearly implies a different ethnicity. This is a crucial instruction.
2.  **ABSOLUTE NO-TEXT RULE**: The final images MUST be purely visual. Your prompts MUST NOT contain any instructions to render text, letters, words, or characters of any language. For example, do not ask to write "한약" on a pouch. Instead, describe "a minimalist pouch with a simple green leaf logo". This is a strict, non-negotiable rule.
3.  **LANGUAGE**: All output prompts must be in ENGLISH.
4.  **OUTPUT FORMAT**: Separate each distinct prompt with the exact delimiter: |||. Do not add numbers or bullet points.

[EXAMPLE]
- **KOREAN TEXT**: " ...한약을 담은 텀블러... 학생들이 편리하게... 책상 위에도 좋고... "
- **numberOfImages**: 3
- **EXPECTED OUTPUT**:
A photorealistic photo of a sleek, modern tumbler filled with dark herbal tea, sitting on a clean wooden desk next to a stack of books. ||| A high-angle shot of a young Korean student in a library, smiling while holding a stylish tumbler, conveying a sense of focus and well-being. ||| A flat lay composition of a sealed herbal medicine pouch and a matching modern tumbler, arranged neatly on a minimalist background.

[KOREAN BLOG TEXT]
---
${blogText}
---

Now, generate exactly ${numberOfImages} prompts following all rules.`,
                config: { temperature: 0.7 }
            });
            return promptsCreationResponse.text.trim();
        }
    } catch (error) {
        console.error("Error suggesting blog image prompts:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`블로그 프롬프트 제안 생성 실패: ${errorMessage}`);
    }
};

export const generateImagesFromPrompts = async (
    prompts: string[],
    aspectRatio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4',
): Promise<ImageData[]> => {
    try {
        if (prompts.length === 0) {
            throw new Error("No prompts provided.");
        }

        const imageGenerationPromises = prompts.map(prompt => 
            generateImage(prompt, aspectRatio, 1)
        );

        const nestedImageDatas = await Promise.all(imageGenerationPromises);
        const allImages = nestedImageDatas.flat();

        if (allImages.length === 0) {
             throw new Error("Image generation failed for all prompts.");
        }
        
        return allImages;
    } catch (error) {
        console.error("Error generating images from prompts:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`프롬프트로 이미지 생성 실패: ${errorMessage}`);
    }
};
