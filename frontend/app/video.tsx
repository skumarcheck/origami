import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useAudioPlayer } from 'expo-audio';
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
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => { loadOrigami(); }, []);

  async function loadOrigami() {
    try {
      const data = await apiCall(`/origami/${id}`);
      setOrigami(data);
    } catch (e) { console.error(e); }
  }

  // Get video/audio URLs for current step
  const stepVideos = origami?.step_videos || [];
  const stepAudios = origami?.step_audio || [];
  const hasPerStepMedia = stepVideos.length > 0;

  // Determine current media URLs
  const videoUrl = hasPerStepMedia && stepVideos[currentStep]
    ? `${BASE_URL}/api/videos/${stepVideos[currentStep]}`
    : origami?.video_file
      ? `${BASE_URL}/api/videos/${origami.video_file}`
      : null;

  const audioUrl = hasPerStepMedia && stepAudios[currentStep]
    ? `${BASE_URL}/api/audio/${stepAudios[currentStep]}`
    : origami?.audio_file
      ? `${BASE_URL}/api/audio/${origami.audio_file}`
      : null;

  // Video player
  const videoPlayer = useVideoPlayer(videoUrl || '', (player) => {
    player.loop = false;
    player.muted = true; // Mute video - only TTS audio should play
  });

  // Audio player
  const audioPlayer = useAudioPlayer(audioUrl || '');

  function handlePlay() {
    if (videoPlayer) videoPlayer.play();
    if (audioPlayer) audioPlayer.play();
    setIsPlaying(true);
  }

  function handlePause() {
    if (videoPlayer) videoPlayer.pause();
    if (audioPlayer) audioPlayer.pause();
    setIsPlaying(false);
  }

  function togglePlay() {
    if (isPlaying) {
      handlePause();
    } else {
      handlePlay();
    }
  }

  function goToStep(stepIndex: number) {
    handlePause();
    setCurrentStep(stepIndex);
    setIsPlaying(false);
  }

  // Auto-play when step changes (after a brief delay for media to load)
  useEffect(() => {
    if (origami && hasPerStepMedia) {
      const url = stepVideos[currentStep]
        ? `${BASE_URL}/api/videos/${stepVideos[currentStep]}`
        : null;
      if (url && videoPlayer) {
        videoPlayer.replace(url);
        videoPlayer.muted = true;
      }
      const aUrl = stepAudios[currentStep]
        ? `${BASE_URL}/api/audio/${stepAudios[currentStep]}`
        : null;
      if (aUrl && audioPlayer) {
        audioPlayer.replace(aUrl);
      }
    }
  }, [currentStep, origami]);

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
  const hasVideo = !!videoUrl;

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
        {hasVideo ? (
          <VideoView
            player={videoPlayer}
            style={styles.videoPlayer}
            contentFit="contain"
            nativeControls={false}
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

        {/* AI Video badge */}
        <View style={styles.aiBadge}>
          <Ionicons name="sparkles" size={14} color={Colors.white} />
          <Text style={styles.aiBadgeText}>{hasPerStepMedia ? `Step ${currentStep + 1}/${steps.length}` : 'AI Video'}</Text>
        </View>

        {/* Play/pause overlay */}
        <TouchableOpacity testID="video-play-btn" style={styles.playOverlay} onPress={togglePlay} activeOpacity={0.9}>
          {!isPlaying && (
            <View style={styles.playCircle}>
              <Ionicons name="play" size={36} color={Colors.white} />
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Step instruction */}
      <View style={styles.instructionBar}>
        <Text style={styles.stepLabel}>Step {currentStep + 1}: {step?.title}</Text>
        <Text style={styles.instructionText} numberOfLines={3}>{step?.instruction}</Text>
        {step?.tip && (
          <View style={styles.tipRow}>
            <Ionicons name="bulb" size={14} color="#EAB308" />
            <Text style={styles.tipText}>{step.tip}</Text>
          </View>
        )}
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          testID="video-prev-btn"
          style={styles.controlBtn}
          onPress={() => currentStep > 0 && goToStep(currentStep - 1)}
          disabled={currentStep === 0}
        >
          <Ionicons name="play-skip-back" size={24} color={currentStep === 0 ? '#475569' : Colors.white} />
        </TouchableOpacity>

        <TouchableOpacity testID="video-toggle-btn" style={[styles.mainPlayBtn, { backgroundColor: origami.color }]} onPress={togglePlay}>
          <Ionicons name={isPlaying ? 'pause' : 'play'} size={32} color={Colors.white} />
        </TouchableOpacity>

        <TouchableOpacity
          testID="video-next-btn"
          style={styles.controlBtn}
          onPress={() => currentStep < steps.length - 1 && goToStep(currentStep + 1)}
          disabled={currentStep >= steps.length - 1}
        >
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
            onPress={() => goToStep(i)}
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
  instructionBar: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#1E293B', marginHorizontal: 16, borderBottomLeftRadius: 12, borderBottomRightRadius: 12 },
  stepLabel: { color: Colors.primary, fontSize: 13, fontWeight: '800' },
  instructionText: { color: '#CBD5E1', fontSize: 14, fontWeight: '600', marginTop: 4, lineHeight: 20 },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, backgroundColor: '#F59E0B15', padding: 8, borderRadius: 8 },
  tipText: { color: '#FDE047', fontSize: 12, fontWeight: '600', flex: 1 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24, paddingVertical: 12 },
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
