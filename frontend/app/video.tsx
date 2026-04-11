import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiCall } from '../utils/api';
import { Colors } from '../utils/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  bird: 'paper-plane', airplane: 'airplane', boat: 'boat', paw: 'paw',
  flower: 'flower', heart: 'heart', leaf: 'leaf', star: 'star',
  flame: 'flame', moon: 'moon', snow: 'snow',
};

export default function VideoPlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [origami, setOrigami] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const STEP_DURATION = 8; // seconds per step

  useEffect(() => {
    loadOrigami();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  async function loadOrigami() {
    try {
      const data = await apiCall(`/origami/${id}`);
      setOrigami(data);
    } catch (e) { console.error(e); }
  }

  useEffect(() => {
    if (isPlaying && origami) {
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => {
          const next = prev + 1;
          const totalDuration = (origami.steps?.length || 1) * STEP_DURATION;
          if (next >= totalDuration) {
            setIsPlaying(false);
            if (timerRef.current) clearInterval(timerRef.current);
            return totalDuration;
          }
          const newStep = Math.floor(next / STEP_DURATION);
          if (newStep !== currentStep) {
            setCurrentStep(newStep);
            animateStepTransition();
          }
          return next;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying, origami]);

  function animateStepTransition() {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }

  function togglePlay() {
    if (!origami) return;
    const totalDuration = (origami.steps?.length || 1) * STEP_DURATION;
    if (elapsedTime >= totalDuration) {
      setElapsedTime(0);
      setCurrentStep(0);
    }
    setIsPlaying(!isPlaying);
  }

  function seekToStep(stepIndex: number) {
    setCurrentStep(stepIndex);
    setElapsedTime(stepIndex * STEP_DURATION);
    animateStepTransition();
  }

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  if (!origami) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.loadingText}>Loading video...</Text>
      </View>
    );
  }

  const steps = origami.steps || [];
  const totalDuration = steps.length * STEP_DURATION;
  const progress = totalDuration > 0 ? elapsedTime / totalDuration : 0;
  const step = steps[currentStep] || steps[0];
  const isFinished = elapsedTime >= totalDuration;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity testID="video-close-btn" style={styles.closeBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.topTitle} numberOfLines={1}>{origami.title}</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Video area */}
      <View style={styles.videoArea}>
        <View style={[styles.videoDisplay, { backgroundColor: origami.color + '15' }]}>
          {/* AI Instructor badge */}
          <View style={styles.aiBadge}>
            <Ionicons name="sparkles" size={14} color={Colors.white} />
            <Text style={styles.aiBadgeText}>AI Instructor</Text>
          </View>

          {/* Visual content area */}
          <View style={styles.visualArea}>
            <Animated.View style={[styles.stepVisual, { opacity: fadeAnim }]}>
              <View style={[styles.bigStepCircle, { backgroundColor: origami.color + '30', borderColor: origami.color }]}>
                <Text style={[styles.bigStepNum, { color: origami.color }]}>{currentStep + 1}</Text>
              </View>
              <Text style={[styles.visualStepTitle, { color: origami.color }]}>{step?.title}</Text>

              {/* Animated fold indicators */}
              <View style={styles.foldAnimation}>
                <View style={[styles.paperShape, { borderColor: origami.color }]}>
                  <Ionicons name={ICON_MAP[origami.icon_name] || 'diamond'} size={40} color={origami.color} />
                </View>
                {isPlaying && (
                  <View style={styles.animDots}>
                    <View style={[styles.animDot, { backgroundColor: origami.color, opacity: 0.3 + (elapsedTime % 3) * 0.2 }]} />
                    <View style={[styles.animDot, { backgroundColor: origami.color, opacity: 0.5 + ((elapsedTime + 1) % 3) * 0.15 }]} />
                    <View style={[styles.animDot, { backgroundColor: origami.color, opacity: 0.3 + ((elapsedTime + 2) % 3) * 0.2 }]} />
                  </View>
                )}
              </View>
            </Animated.View>
          </View>

          {/* Instruction overlay */}
          <Animated.View style={[styles.instructionOverlay, { opacity: fadeAnim }]}>
            <Text style={styles.instructionText} numberOfLines={3}>{step?.instruction}</Text>
            {step?.tip && (
              <View style={styles.tipRow}>
                <Ionicons name="bulb" size={14} color="#EAB308" />
                <Text style={styles.tipText}>{step.tip}</Text>
              </View>
            )}
          </Animated.View>
        </View>

        {/* Play/Pause overlay */}
        <TouchableOpacity
          testID="video-play-btn"
          style={styles.playOverlay}
          onPress={togglePlay}
          activeOpacity={0.8}
        >
          {!isPlaying && (
            <View style={styles.playCircle}>
              <Ionicons name={isFinished ? 'refresh' : 'play'} size={36} color={Colors.white} />
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: origami.color }]} />
        </View>
        <View style={styles.timeRow}>
          <Text style={styles.timeText}>{formatTime(elapsedTime)}</Text>
          <Text style={styles.timeText}>{formatTime(totalDuration)}</Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          testID="video-prev-btn"
          style={styles.controlBtn}
          onPress={() => currentStep > 0 && seekToStep(currentStep - 1)}
          disabled={currentStep === 0}
        >
          <Ionicons name="play-skip-back" size={24} color={currentStep === 0 ? Colors.textLight : Colors.white} />
        </TouchableOpacity>

        <TouchableOpacity testID="video-toggle-btn" style={[styles.mainPlayBtn, { backgroundColor: origami.color }]} onPress={togglePlay}>
          <Ionicons name={isPlaying ? 'pause' : (isFinished ? 'refresh' : 'play')} size={32} color={Colors.white} />
        </TouchableOpacity>

        <TouchableOpacity
          testID="video-next-btn"
          style={styles.controlBtn}
          onPress={() => currentStep < steps.length - 1 && seekToStep(currentStep + 1)}
          disabled={currentStep >= steps.length - 1}
        >
          <Ionicons name="play-skip-forward" size={24} color={currentStep >= steps.length - 1 ? Colors.textLight : Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Step list */}
      <ScrollView style={styles.stepList} contentContainerStyle={styles.stepListContent}>
        <Text style={styles.stepListTitle}>All Steps</Text>
        {steps.map((s: any, i: number) => (
          <TouchableOpacity
            key={i}
            testID={`video-step-${i}`}
            style={[styles.stepRow, i === currentStep && { backgroundColor: origami.color + '15', borderColor: origami.color + '40' }]}
            onPress={() => seekToStep(i)}
            activeOpacity={0.7}
          >
            <View style={[styles.stepDot, i === currentStep && { backgroundColor: origami.color }, i < currentStep && { backgroundColor: Colors.success }]}>
              {i < currentStep ? (
                <Ionicons name="checkmark" size={12} color={Colors.white} />
              ) : (
                <Text style={[styles.stepDotText, (i === currentStep || i < currentStep) && { color: Colors.white }]}>{i + 1}</Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.stepRowTitle, i === currentStep && { color: origami.color, fontWeight: '800' }]}>{s.title}</Text>
            </View>
            {i === currentStep && isPlaying && (
              <View style={styles.nowPlaying}>
                <View style={[styles.eqBar, { height: 8, backgroundColor: origami.color }]} />
                <View style={[styles.eqBar, { height: 14, backgroundColor: origami.color }]} />
                <View style={[styles.eqBar, { height: 6, backgroundColor: origami.color }]} />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  center: { alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: Colors.white, fontSize: 16, fontWeight: '600' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
  },
  closeBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontSize: 18, fontWeight: '800', color: Colors.white, flex: 1, textAlign: 'center' },
  videoArea: { position: 'relative', marginHorizontal: 16 },
  videoDisplay: {
    borderRadius: 20, overflow: 'hidden', aspectRatio: 16 / 9,
    maxHeight: 300,
    justifyContent: 'center', alignItems: 'center',
  },
  aiBadge: {
    position: 'absolute', top: 12, left: 12, zIndex: 10,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  aiBadgeText: { color: Colors.white, fontSize: 12, fontWeight: '700' },
  visualArea: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 10 },
  stepVisual: { alignItems: 'center' },
  bigStepCircle: {
    width: 60, height: 60, borderRadius: 30,
    alignItems: 'center', justifyContent: 'center', borderWidth: 3, marginBottom: 8,
  },
  bigStepNum: { fontSize: 26, fontWeight: '900' },
  visualStepTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  foldAnimation: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  paperShape: {
    width: 60, height: 60, borderRadius: 12,
    borderWidth: 2, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
  },
  animDots: { flexDirection: 'column', gap: 4 },
  animDot: { width: 8, height: 8, borderRadius: 4 },
  instructionOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)', padding: 14,
  },
  instructionText: { color: Colors.white, fontSize: 14, fontWeight: '600', lineHeight: 20 },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  tipText: { color: '#FDE047', fontSize: 12, fontWeight: '600', flex: 1 },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center', borderRadius: 20,
  },
  playCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center',
  },
  progressSection: { paddingHorizontal: 20, paddingTop: 12 },
  progressBar: { height: 4, backgroundColor: '#334155', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  timeText: { color: '#94A3B8', fontSize: 12, fontWeight: '600' },
  controls: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 24, paddingVertical: 14,
  },
  controlBtn: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  mainPlayBtn: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center',
  },
  stepList: { flex: 1, paddingHorizontal: 16 },
  stepListContent: { paddingBottom: 20 },
  stepListTitle: { color: '#94A3B8', fontSize: 14, fontWeight: '700', marginBottom: 10 },
  stepRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12,
    borderWidth: 1, borderColor: 'transparent', marginBottom: 4,
  },
  stepDot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#334155', alignItems: 'center', justifyContent: 'center',
  },
  stepDotText: { color: '#94A3B8', fontSize: 12, fontWeight: '800' },
  stepRowTitle: { color: '#CBD5E1', fontSize: 14, fontWeight: '600' },
  nowPlaying: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  eqBar: { width: 3, borderRadius: 1 },
});
