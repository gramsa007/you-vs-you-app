// src/utils/helpers.ts

export const prepareData = (workouts: any[]) => {
  return workouts.map(workout => ({
    ...workout,
    exercises: workout.exercises.map((ex: any) => ({
      ...ex,
      logs: ex.logs || Array.from({ length: ex.sets }).map(() => ({
        weight: '',
        reps: '',
        completed: false
      }))
    }))
  }));
};

export const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute:'2-digit' });
};
// src/utils/helpers.ts (am Ende einfügen)

export const getStaticWarmup = (focus: string) => {
  const focusLower = focus?.toLowerCase() || "";
  if (focusLower.includes("leg") || focusLower.includes("bein") || focusLower.includes("unterkörper")) {
    return `🔥 BEIN-FOKUS WARM-UP (RAMP)\n\n1. PULS (2 Min)\n• 1 Min Joggen auf der Stelle\n• 1 Min Jumping Jacks\n\n2. MOBILISIERUNG (2 Min)\n• 10x Leg Swings (vor/zurück pro Bein)\n• 10x Leg Swings (seitlich pro Bein)\n• 10x Tiefe Hocke (Deep Squat Hold)\n\n3. AKTIVIERUNG (1 Min)\n• 20x Glute Bridges\n• 10x Bodyweight Lunges`;
  }
  if (focusLower.includes("push") || focusLower.includes("pull") || focusLower.includes("upper") || focusLower.includes("oberkörper")) {
    return `🔥 OBERKÖRPER WARM-UP (RAMP)\n\n1. PULS (2 Min)\n• 1 Min Seilspringen\n• 1 Min Armkreisen\n\n2. MOBILISIERUNG (2 Min)\n• 10x Wall Slides\n• 10x Cat-Cow Stretch\n• 10x Thoracic Rotation\n\n3. AKTIVIERUNG (1 Min)\n• 10x Band Pull-Aparts\n• 10x Scapular Push Ups`;
  }
  return `🔥 GENERAL WARM-UP (RAMP)\n\n1. RAISE (2 Min)\n• 30sek High Knees\n• 30sek Butt Kicks\n• 1 Min Hampelmann\n\n2. MOBILIZE (2 Min)\n• 10x World's Greatest Stretch\n• 10x Raupengang\n\n3. ACTIVATE (1 Min)\n• 15x Air Squats\n• 10x Plank zu Downward Dog`;
};

export const getStaticCooldown = (focus: string) => {
  const focusLower = focus?.toLowerCase() || "";
  if (focusLower.includes("leg") || focusLower.includes("bein") || focusLower.includes("unterkörper")) {
    return `❄️ BEIN-FOKUS COOL DOWN\n\n1. HÜFTE & GESÄSS (2 Min)\n• Pigeon Pose (Taube)\n• Couch Stretch\n\n2. OBERSCHENKEL (2 Min)\n• Standing Quad Stretch\n• Seated Hamstring Stretch\n\n3. RELAX (1 Min)\n• Legs Up The Wall`;
  }
  if (focusLower.includes("push") || focusLower.includes("pull") || focusLower.includes("upper") || focusLower.includes("oberkörper")) {
    return `❄️ OBERKÖRPER COOL DOWN\n\n1. BRUST & SCHULTERN (2 Min)\n• Doorway Stretch\n• Cross-Body Shoulder Stretch\n\n2. RÜCKEN (2 Min)\n• Child's Pose\n• Lat Stretch\n\n3. NACKEN (1 Min)\n• Sanftes Nacken-Neigen`;
  }
  return `❄️ GENERAL COOL DOWN\n\n1. POSTERIOR CHAIN (2 Min)\n• Standing Forward Fold\n• Downward Dog\n\n2. SPINE & HIPS (2 Min)\n• Spinal Twist im Liegen\n\n3. ATMEN (1 Min)\n• Corpse Pose (Savasana)`;
};