import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode, Audio } from 'expo-av';
import { apiCall } from '../utils/api';
import { Colors } from '../utils/colors';

const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

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
  const videoRef = useRef<Video>(null);
  const audioRef = useRef<Audio.Sound | null>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [videoPosition, setVideoPosition] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);

  useEffect(() => {
    loadOrigami();
    return () => {
      if (audioRef.current) {
        audioRef.current.unloadAsync();
      }
    };
  }, []);

  async function loadOrigami() {
    try {
      const data = await apiCall(`/origami/${id}`);
      setOrigami(data);
      if (data.audio_file) {
        await loadAudio(data.audio_file);
      }
    } catch (e) { console.error(e); }
  }

  async function loadAudio(audioFile: string) {
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: `${BASE_URL}/api/audio/${audioFile}` },
        { shouldPlay: false }
      );
      audioRef.current = sound;
      setAudioLoaded(true);
    } catch (e) { console.error('Audio load error:', e); }
  }

  async function togglePlay() {
    if (!origami) return;
    if (isPlaying) {
      await videoRef.current?.pauseAsync();
      await audioRef.current?.pauseAsync();
      setIsPlaying(false);
    } else {
      await videoRef.current?.playAsync();
      await audioRef.current?.playAsync();
      setIsPlaying(true);
    }
  }

  async function seekToStep(stepIndex: number) {
    setCurrentStep(stepIndex);
    if (videoDuration > 0 && origami?.steps?.length) {
      const stepDuration = videoDuration / origami.steps.length;
      const position = stepIndex * stepDuration;
      await videoRef.current?.setPositionMillis(position);
      await audioRef.current?.setPositionMillis(position);
    }
  }

  function handleVideoStatus(status: any) {
    if (status.isLoaded) {
      setVideoLoaded(true);
      setVideoPosition(status.positionMillis || 0);
      setVideoDuration(status.durationMillis || 0);
      if (status.durationMillis && origami?.steps?.length) {
        const stepDuration = status.durationMillis / origami.steps.length;
        const newStep = Math.min(Math.floor((status.positionMillis || 0) / stepDuration), origami.steps.length - 1);
        if (newStep !== currentStep) setCurrentStep(newStep);
      }
      if (status.didJustFinish) {
        setIsPlaying(false);
      }
    }
  }

  function formatTime(ms: number) {
    const total = Math.floor(ms / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  if (!origami) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading tutorial...</Text>
      </View>
    );
  }

  const steps = origami.steps || [];
  const step = steps[currentStep] || steps[0];
  const hasRealVideo = !!origami.video_file;
  const progress = videoDuration > 0 ? videoPosition / videoDuration : 0;

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
        {hasRealVideo ? (
          <Video
            ref={videoRef}
            source={{ uri: `${BASE_URL}/api/videos/${origami.video_file}` }}
            style={styles.videoPlayer}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={false}
            isLooping={false}
            onPlaybackStatusUpdate={handleVideoStatus}
            useNativeControls={false}
          />
        ) : (
          <View style={[styles.videoFallback, { backgroundColor: origami.color + '15' }]}>
            <View style={[styles.bigStepCircle, { backgroundColor: origami.color + '30', borderColor: origami.color }]}>
              <Text style={[styles.bigStepNum, { color: origami.color }]}>{currentStep + 1}</Text>
            </View>
            <Text style={[styles.fallbackTitle, { color: origami.color }]}>{step?.title}</Text>
            <Ionicons name={ICON_MAP[origami.icon_name] || 'diamond'} size={40} color={origami.color} />
          </View>
        )}

        {/* AI Instructor badge */}
        <View style={styles.aiBadge}>
          <Ionicons name="sparkles" size={14} color={Colors.white} />
          <Text style={styles.aiBadgeText}>{hasRealVideo ? 'AI Video' : 'AI Instructor'}</Text>
        </View>

        {/* Play overlay (only when paused) */}
        {!isPlaying && (
          <TouchableOpacity testID="video-play-btn" style={styles.playOverlay} onPress={togglePlay} activeOpacity={0.8}>
            <View style={styles.playCircle}>
              <Ionicons name="play" size={36} color={Colors.white} />
            </View>
          </TouchableOpacity>
        )}

        {/* Tap to pause when playing */}
        {isPlaying && (
          <TouchableOpacity style={styles.playOverlay} onPress={togglePlay} activeOpacity={1} />
        )}
      </View>

      {/* Instruction overlay */}
      <View style={styles.instructionBar}>
        <Text style={styles.stepLabel}>Step {currentStep + 1}: {step?.title}</Text>
        <Text style={styles.instructionText} numberOfLines={2}>{step?.instruction}</Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: origami.color }]} />
        </View>
        <View style={styles.timeRow}>
          <Text style={styles.timeText}>{formatTime(videoPosition)}</Text>
          <Text style={styles.timeText}>{formatTime(videoDuration)}</Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity testID="video-prev-btn" style={styles.controlBtn} onPress={() => currentStep > 0 && seekToStep(currentStep - 1)} disabled={currentStep === 0}>
          <Ionicons name="play-skip-back" size={24} color={currentStep === 0 ? '#475569' : Colors.white} />
        </TouchableOpacity>
        <TouchableOpacity testID="video-toggle-btn" style={[styles.mainPlayBtn, { backgroundColor: origami.color }]} onPress={togglePlay}>
          <Ionicons name={isPlaying ? 'pause' : 'play'} size={32} color={Colors.white} />
        </TouchableOpacity>
        <TouchableOpacity testID="video-next-btn" style={styles.controlBtn} onPress={() => currentStep < steps.length - 1 && seekToStep(currentStep + 1)} disabled={currentStep >= steps.length - 1}>
          <Ionicons name="play-skip-forward" size={24} color={currentStep >= steps.length - 1 ? '#475569' : Colors.white} />
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
            <Text style={[styles.stepRowTitle, i === currentStep && { color: origami.color, fontWeight: '800' }]}>{s.title}</Text>
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
  loadingText: { color: Colors.white, fontSize: 16, fontWeight: '600', marginTop: 12 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8 },
  closeBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontSize: 18, fontWeight: '800', color: Colors.white, flex: 1, textAlign: 'center' },
  videoArea: { position: 'relative', marginHorizontal: 16, borderRadius: 16, overflow: 'hidden', backgroundColor: '#1E293B' },
  videoPlayer: { width: '100%', aspectRatio: 16 / 9, maxHeight: 300 },
  videoFallback: { width: '100%', aspectRatio: 16 / 9, maxHeight: 300, justifyContent: 'center', alignItems: 'center', gap: 8 },
  bigStepCircle: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', borderWidth: 3 },
  bigStepNum: { fontSize: 22, fontWeight: '900' },
  fallbackTitle: { fontSize: 16, fontWeight: '800' },
  aiBadge: {
    position: 'absolute', top: 10, left: 10,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  aiBadgeText: { color: Colors.white, fontSize: 12, fontWeight: '700' },
  playOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  playCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  instructionBar: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#1E293B', marginHorizontal: 16, borderBottomLeftRadius: 12, borderBottomRightRadius: 12 },
  stepLabel: { color: Colors.primary, fontSize: 13, fontWeight: '800' },
  instructionText: { color: '#CBD5E1', fontSize: 14, fontWeight: '600', marginTop: 4, lineHeight: 20 },
  progressSection: { paddingHorizontal: 20, paddingTop: 10 },
  progressBar: { height: 4, backgroundColor: '#334155', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  timeText: { color: '#94A3B8', fontSize: 12, fontWeight: '600' },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24, paddingVertical: 10 },
  controlBtn: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  mainPlayBtn: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  stepList: { flex: 1, paddingHorizontal: 16 },
  stepListContent: { paddingBottom: 20 },
  stepListTitle: { color: '#94A3B8', fontSize: 14, fontWeight: '700', marginBottom: 8 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10, borderWidth: 1, borderColor: 'transparent', marginBottom: 3 },
  stepDot: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#334155', alignItems: 'center', justifyContent: 'center' },
  stepDotText: { color: '#94A3B8', fontSize: 12, fontWeight: '800' },
  stepRowTitle: { color: '#CBD5E1', fontSize: 14, fontWeight: '600', flex: 1 },
  nowPlaying: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  eqBar: { width: 3, borderRadius: 1 },
});
