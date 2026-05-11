import { router, useLocalSearchParams } from 'expo-router';
import {
  Activity,
  Briefcase,
  Building,
  Coffee,
  Coins,
  Droplets,
  Flame,
  Handshake,
  Heart,
  Home,
  Leaf,
  MapPin,
  Mountain,
  Plane,
  Rocket,
  Sparkles,
  User,
  Users,
  Users2,
  Wind,
  type LucideIcon,
} from 'lucide-react-native';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';

import { useAuth } from '@/data/auth';
import { AppScreen, MonoLabel } from '@/design/primitives';
import { colors, fonts, radius, spacing } from '@/design/tokens';
import { geocodeCity, generateReading, type GeocodeResult } from '@/lib/api';
import { supabase } from '@/lib/supabase';

type ReadingType = 'travel' | 'relocation' | 'couples';
type WeatherIntent = 'personal' | 'mundane';

type PartnerProfile = {
  id: string;
  first_name: string;
  birth_date: string;
  birth_city: string;
  label: string | null;
};

type PickedCity = GeocodeResult;

const readingTypes: { id: ReadingType; title: string; sub: string; icon: LucideIcon; color: string }[] = [
  { id: 'travel', title: 'Travel Reading', sub: 'Short-term transits and lines', icon: Plane, color: colors.y2kBlue },
  { id: 'relocation', title: 'Relocation Reading', sub: 'Long-term house shifts and IC lines', icon: Building, color: colors.acqua },
  { id: 'couples', title: 'Couples Reading', sub: 'Synastry composite lines', icon: Users, color: colors.spicedLife },
];

const lifeGoals = [
  { id: 'identity', label: 'Identity & Self-Discovery', sub: '1st + 9th house emphasis', icon: User, color: colors.y2kBlue },
  { id: 'wealth', label: 'Wealth & Financial Growth', sub: '2nd + 8th house momentum', icon: Coins, color: colors.gold },
  { id: 'home', label: 'Home, Family & Roots', sub: '4th house foundation', icon: Home, color: colors.acqua },
  { id: 'romance', label: 'Romance & Love', sub: '5th + 7th house chemistry', icon: Heart, color: colors.spicedLife },
  { id: 'health', label: 'Health, Routine & Wellness', sub: '6th + 12th house balance', icon: Activity, color: colors.sage },
  { id: 'partnerships', label: 'Partnerships & Marriage', sub: '7th + 11th house bonds', icon: Handshake, color: colors.spicedLife },
  { id: 'career', label: 'Career & Public Recognition', sub: '10th + 6th house visibility', icon: Briefcase, color: colors.y2kBlue },
  { id: 'friendship', label: 'Friendship & Networking', sub: '11th + 3rd house community', icon: Users2, color: colors.acqua },
  { id: 'spirituality', label: 'Spirituality & Inner Peace', sub: '12th + 9th house reflection', icon: Sparkles, color: colors.gold },
];

const weatherGoals = [
  { id: 'floods', label: 'Floods & storms', sub: 'Water-resonant pressure', icon: Droplets, color: colors.y2kBlue },
  { id: 'fires', label: 'Fires & heat', sub: 'Fire-resonant volatility', icon: Flame, color: colors.spicedLife },
  { id: 'quakes', label: 'Earthquakes & structural', sub: 'Saturn and Pluto pressure', icon: Mountain, color: colors.gold },
  { id: 'atmospheric', label: 'Atmospheric disruption', sub: 'Mercury and Uranus layers', icon: Wind, color: colors.acqua },
  { id: 'civil', label: 'Public / civil tension', sub: 'World points and Mars angles', icon: Users2, color: colors.spicedLife },
  { id: 'all', label: 'Just show everything', sub: 'Surface every layer that fires', icon: Sparkles, color: colors.sage },
];

const personalWeatherGoals = [
  { id: 'rest', label: 'Rest & recover', sub: 'Favor Moon and Venus on IC', icon: Leaf, color: colors.sage },
  { id: 'connect', label: 'Meet people', sub: 'Venus and Jupiter on Descendant', icon: Heart, color: colors.spicedLife },
  { id: 'launch', label: 'Launch or announce', sub: 'Sun and Mercury on Midheaven', icon: Rocket, color: colors.y2kBlue },
  { id: 'retreat', label: 'Quiet retreat', sub: '12th house and Neptune layers', icon: Coffee, color: colors.acqua },
  { id: 'reconcile', label: 'Reconcile / repair', sub: 'Venus returns and soft aspects', icon: Handshake, color: colors.gold },
  { id: 'all', label: 'Just show everything', sub: 'No filter', icon: Sparkles, color: colors.sage },
];

const windowOptions: { days: 7 | 30 | 90; label: string; sub: string }[] = [
  { days: 7, label: '7d', sub: 'Next week. Short-term triggers.' },
  { days: 30, label: '30d', sub: 'The month ahead. Most reading types.' },
  { days: 90, label: '90d', sub: 'The quarter. Station cycles and eclipse windows.' },
];

export function NewReadingScreen({ defaultType }: { defaultType?: ReadingType } = {}) {
  const { type: queryType, intent: queryIntent } = useLocalSearchParams<{ type?: string; intent?: string }>();
  const weatherMode = queryType === 'weather';

  if (weatherMode) {
    return <WeatherReadingFlow defaultIntent={queryIntent === 'mundane' ? 'mundane' : undefined} />;
  }

  return <StandardReadingFlow defaultType={defaultType} />;
}

function StandardReadingFlow({ defaultType }: { defaultType?: ReadingType }) {
  const { session } = useAuth();
  const [screen, setScreen] = useState(defaultType ? 1 : 0);
  const [type, setType] = useState<ReadingType>(defaultType ?? 'travel');
  const [goals, setGoals] = useState<string[]>([]);
  const [destination, setDestination] = useState('');
  const [resolvedDestination, setResolvedDestination] = useState<GeocodeResult | null>(null);
  const [date, setDate] = useState('');
  const [partners, setPartners] = useState<PartnerProfile[]>([]);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [showAddPartner, setShowAddPartner] = useState(false);
  const [partnerSaving, setPartnerSaving] = useState(false);
  const [newPartner, setNewPartner] = useState({
    firstName: '',
    birthDate: '',
    birthTime: '12:00',
    birthCity: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const minScreen = defaultType ? 1 : 0;
  const destinationScreen = type === 'couples' ? 3 : 2;
  const totalSteps = (type === 'couples' ? 4 : 3) - (defaultType ? 1 : 0);

  useEffect(() => {
    if (type !== 'couples' || !session?.user.id) return;

    supabase
      .from('partner_profiles')
      .select('id, first_name, birth_date, birth_city, label')
      .eq('owner_id', session.user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setPartners((data ?? []) as PartnerProfile[]);
      });
  }, [session?.user.id, type]);

  const go = (nextScreen: number) => setScreen(Math.max(minScreen, Math.min(nextScreen, destinationScreen)));
  const displayStep = (actualScreen: number) => (defaultType ? actualScreen : actualScreen + 1);

  const toggleGoal = (id: string) => {
    setGoals((current) => {
      if (current.includes(id)) return current.filter((goal) => goal !== id);
      if (current.length >= 3) return current;
      return [...current, id];
    });
  };

  const resolveDestination = async () => {
    const query = destination.trim();
    if (!query) return null;
    if (resolvedDestination?.label === query) return resolvedDestination;

    const resolved = await geocodeCity(query);
    setResolvedDestination(resolved);
    return resolved;
  };

  const savePartner = async () => {
    if (!session?.user.id || !newPartner.firstName || !newPartner.birthDate || !newPartner.birthCity) return;
    setPartnerSaving(true);
    setError('');

    const resolved = await geocodeCity(newPartner.birthCity);
    const { data, error: partnerError } = await supabase
      .from('partner_profiles')
      .insert({
        owner_id: session.user.id,
        label: 'Partner',
        first_name: newPartner.firstName,
        birth_date: newPartner.birthDate,
        birth_time: `${newPartner.birthTime}:00`,
        birth_time_known: true,
        birth_city: resolved?.label ?? newPartner.birthCity,
        birth_lat: resolved?.lat ?? null,
        birth_lon: resolved?.lon ?? null,
      })
      .select('id, first_name, birth_date, birth_city, label')
      .single();

    setPartnerSaving(false);

    if (partnerError || !data) {
      setError(partnerError?.message ?? 'Could not save partner.');
      return;
    }

    setPartners((current) => [data as PartnerProfile, ...current]);
    setPartnerId(data.id);
    setShowAddPartner(false);
    setNewPartner({ firstName: '', birthDate: '', birthTime: '12:00', birthCity: '' });
  };

  const submit = async () => {
    if (!session?.access_token) {
      setError('Please sign in again before generating a reading.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const resolved = await resolveDestination();
      if (!resolved) {
        setError('Could not find that city. Try "Tokyo, Japan" or select a more specific place.');
        setLoading(false);
        return;
      }

      const result = await generateReading(session.access_token, {
        destination: resolved.label,
        travelType: type === 'relocation' ? 'relocation' : 'trip',
        readingCategory: type === 'couples' ? 'synastry' : 'astrocartography',
        targetLat: resolved.lat,
        targetLon: resolved.lon,
        travelDate: date || todayISO(),
        goals,
        ...(type === 'couples' && partnerId ? { partner_id: partnerId } : {}),
      });

      if (result.ok) {
        router.replace(`/reading/${result.readingId}`);
        return;
      }

      setError(result.message);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to generate reading.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <WizardLoading label={type === 'couples' ? 'Generating your couples reading...' : 'Generating your reading...'} />;
  }

  return (
    <AppScreen contentStyle={styles.screenContent}>
      <View style={styles.flowFrame}>
        {screen === 0 ? (
          <WizardStep step={displayStep(0)} total={totalSteps} title="What kind of" accent="reading?" body="Choose the reading engine calculation mode.">
            <View style={styles.optionStack}>
              {readingTypes.map((item) => (
                <OptionRow
                  key={item.id}
                  active={type === item.id}
                  icon={item.icon}
                  color={item.color}
                  title={item.title}
                  sub={item.sub}
                  onPress={() => setType(item.id)}
                />
              ))}
            </View>
            <WizardFooter onNext={() => go(1)} nextLabel="Continue" />
          </WizardStep>
        ) : null}

        {screen === 1 && type === 'couples' ? (
          <WizardStep step={displayStep(1)} total={totalSteps} title="Who is your" accent="partner?" body="Select a saved partner or add a new one to compute the synastry overlay.">
            {partners.length > 0 && !showAddPartner ? (
              <View style={styles.optionStack}>
                {partners.map((partner) => (
                  <OptionRow
                    key={partner.id}
                    active={partnerId === partner.id}
                    icon={Heart}
                    color={colors.spicedLife}
                    title={partner.first_name}
                    sub={`${partner.birth_date} - ${partner.birth_city}`}
                    onPress={() => setPartnerId(partner.id)}
                  />
                ))}
                <Pressable style={styles.dashedButton} onPress={() => setShowAddPartner(true)}>
                  <Text style={styles.dashedButtonText}>+ Add new partner</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.partnerForm}>
                <WizardTextInput label="Partner name" placeholder="e.g. Alex" value={newPartner.firstName} onChangeText={(firstName) => setNewPartner((p) => ({ ...p, firstName }))} />
                <WizardTextInput label="Date of birth" placeholder="YYYY-MM-DD" value={newPartner.birthDate} onChangeText={(birthDate) => setNewPartner((p) => ({ ...p, birthDate }))} />
                <WizardTextInput label="Time of birth" placeholder="HH:MM" value={newPartner.birthTime} onChangeText={(birthTime) => setNewPartner((p) => ({ ...p, birthTime }))} />
                <WizardTextInput label="City of birth" placeholder="e.g. Paris, France" value={newPartner.birthCity} onChangeText={(birthCity) => setNewPartner((p) => ({ ...p, birthCity }))} />
                <Pressable style={[styles.primaryButton, partnerSaving && styles.disabled]} onPress={savePartner} disabled={partnerSaving}>
                  <Text style={styles.primaryButtonText}>{partnerSaving ? 'Saving...' : 'Save partner'}</Text>
                </Pressable>
                {partners.length > 0 ? (
                  <Pressable onPress={() => setShowAddPartner(false)}>
                    <Text style={styles.linkText}>Cancel</Text>
                  </Pressable>
                ) : null}
              </View>
            )}
            <WizardError message={error} />
            <WizardFooter onBack={() => go(screen - 1)} onNext={() => go(2)} nextDisabled={!partnerId} nextLabel="Continue" />
          </WizardStep>
        ) : null}

        {screen === (type === 'couples' ? 2 : 1) ? (
          <WizardStep
            step={displayStep(type === 'couples' ? 2 : 1)}
            total={totalSteps}
            title="What are you"
            accent="looking for?"
            accentColor={colors.spicedLife}
            body="Select up to 3 goals. We'll prioritize the planetary lines that matter most to your intention.">
            <View style={styles.goalGrid}>
              {lifeGoals.map((goal) => (
                <GoalTile
                  key={goal.id}
                  active={goals.includes(goal.id)}
                  disabled={!goals.includes(goal.id) && goals.length >= 3}
                  goal={goal}
                  onPress={() => toggleGoal(goal.id)}
                />
              ))}
            </View>
            <WizardFooter onBack={() => go(screen - 1)} onNext={() => go(screen + 1)} nextDisabled={goals.length === 0} nextLabel="Continue" />
          </WizardStep>
        ) : null}

        {screen === destinationScreen ? (
          <WizardStep
            step={displayStep(destinationScreen)}
            total={totalSteps}
            title="Where are"
            accent="you going?"
            accentColor={colors.gold}
            body={`Calculate the final shifted ${type === 'couples' ? 'synastry' : 'chart'}.`}>
            <View style={styles.inputStack}>
              <View style={styles.destinationRow}>
                <WizardTextInput
                  label="Destination city"
                  placeholder="e.g. Tokyo, Japan"
                  value={destination}
                  onChangeText={(value) => {
                    setDestination(value);
                    setResolvedDestination(null);
                  }}
                  style={styles.destinationInput}
                />
                <MapPin color={colors.textTertiary} size={24} strokeWidth={1.8} />
              </View>
              <WizardTextInput
                label="Target date (optional)"
                placeholder="mm/dd/yyyy"
                onChangeText={setDate}
                value={date}
              />
            </View>
            <WizardError message={error} />
            <WizardFooter onBack={() => go(screen - 1)} onNext={submit} nextDisabled={!destination.trim()} nextLabel="Generate Reading" />
          </WizardStep>
        ) : null}
      </View>
    </AppScreen>
  );
}

function WeatherReadingFlow({ defaultIntent }: { defaultIntent?: WeatherIntent }) {
  const { session } = useAuth();
  const [screen, setScreen] = useState(defaultIntent ? 1 : 0);
  const [intent, setIntent] = useState<WeatherIntent | null>(defaultIntent ?? null);
  const [cityInput, setCityInput] = useState('');
  const [cities, setCities] = useState<PickedCity[]>([]);
  const [windowDays, setWindowDays] = useState<7 | 30 | 90>(30);
  const [goal, setGoal] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resolvingCity, setResolvingCity] = useState(false);
  const [error, setError] = useState('');

  const startDate = useMemo(() => new Date(), []);
  const endDate = useMemo(() => {
    const next = new Date(startDate);
    next.setDate(next.getDate() + windowDays);
    return next;
  }, [startDate, windowDays]);
  const total = defaultIntent ? 3 : 4;
  const stepNumber = (actualScreen: number) => (defaultIntent ? actualScreen : actualScreen + 1);
  const activeGoals = intent === 'mundane' ? weatherGoals : personalWeatherGoals;

  const addCity = async () => {
    if (!cityInput.trim() || cities.length >= 3) return;
    setResolvingCity(true);
    setError('');
    try {
      const resolved = await geocodeCity(cityInput.trim());
      if (!resolved) {
        setError('Could not find that city. Try a more specific city and country.');
        return;
      }
      if (!cities.some((city) => city.label === resolved.label)) {
        setCities((current) => [...current, resolved]);
      }
      setCityInput('');
    } catch (cityError) {
      setError(cityError instanceof Error ? cityError.message : 'Could not resolve city.');
    } finally {
      setResolvingCity(false);
    }
  };

  const submit = async () => {
    if (!session?.access_token) {
      setError('Please sign in again before generating a forecast.');
      return;
    }
    if (cities.length === 0) return;

    setLoading(true);
    setError('');

    try {
      const result = await generateReading(session.access_token, {
        destination: cities[0].label,
        travelType: 'trip',
        readingCategory: 'geodetic-weather',
        targetLat: cities[0].lat,
        targetLon: cities[0].lon,
        travelDate: formatISO(startDate),
        goals: goal ? [goal] : [],
        weather: {
          cities,
          windowDays,
          startDate: formatISO(startDate),
          endDate: formatISO(endDate),
          goalFilter: goal,
          intent: intent ?? 'personal',
        },
      });

      if (result.ok) {
        router.replace(`/reading/${result.readingId}?type=weather`);
        return;
      }

      setError(result.message);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to generate forecast.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <WizardLoading label={`Computing ${windowDays} day weather forecast...`} />;
  }

  return (
    <AppScreen contentStyle={styles.screenContent}>
      <Text style={styles.backgroundScript}>watching</Text>
      <View style={styles.flowFrame}>
        {screen === 0 ? (
          <WizardStep step={stepNumber(0)} total={total} title="What do you want" accent="to know?" body="Two separate readings share one engine.">
            <View style={styles.optionStack}>
              <OptionRow active={intent === 'personal'} icon={MapPin} color={colors.acqua} title="What this place does to me" sub="Travel timing, chart-ruler relocation, best dates, personal lines." onPress={() => setIntent('personal')} />
              <OptionRow active={intent === 'mundane'} icon={Wind} color={colors.y2kBlue} title="What the sky is doing here" sub="Earth-weather forecast. Floods, fires, seismic and atmospheric pressure." onPress={() => setIntent('mundane')} />
            </View>
            <WizardFooter onNext={() => setScreen(1)} nextDisabled={!intent} nextLabel="Continue" />
          </WizardStep>
        ) : null}

        {screen === 1 ? (
          <WizardStep step={stepNumber(1)} total={total} title="Where should" accent="the sky watch?" body="Pick a city, or up to 3 to compare.">
            <View style={styles.inputStack}>
              {cities.length < 3 ? (
                <>
                  <WizardTextInput label={cities.length === 0 ? 'City' : 'Add another place'} placeholder="e.g. Valencia, Spain" value={cityInput} onChangeText={setCityInput} />
                  <Pressable style={[styles.secondaryFullButton, resolvingCity && styles.disabled]} onPress={addCity} disabled={resolvingCity}>
                    <Text style={styles.secondaryFullButtonText}>{resolvingCity ? 'Finding city...' : 'Add city'}</Text>
                  </Pressable>
                </>
              ) : null}
              {cities.map((city) => (
                <View key={city.label} style={styles.cityRow}>
                  <View>
                    <Text style={styles.cityTitle}>{city.label}</Text>
                    <Text style={styles.cityMeta}>MC {formatAngle(city.lon)} - ASC {formatAngle(city.lon + 90)}</Text>
                  </View>
                  <Pressable onPress={() => setCities((current) => current.filter((item) => item.label !== city.label))}>
                    <Text style={styles.removeText}>Remove</Text>
                  </Pressable>
                </View>
              ))}
            </View>
            <WizardError message={error} />
            <WizardFooter onBack={defaultIntent ? undefined : () => setScreen(0)} onNext={() => setScreen(2)} nextDisabled={cities.length === 0} nextLabel="Continue" />
          </WizardStep>
        ) : null}

        {screen === 2 ? (
          <WizardStep step={stepNumber(2)} total={total} title="For how many" accent="days ahead?" body="Pick the forecast window. The engine snapshots the sky once per day.">
            <View style={styles.optionStack}>
              {windowOptions.map((option) => (
                <OptionRow key={option.days} active={windowDays === option.days} mark={option.label} color={colors.acqua} title={option.label} sub={option.sub} onPress={() => setWindowDays(option.days)} />
              ))}
            </View>
            <Text style={styles.dateRange}>{formatISO(startDate)} - {formatISO(endDate)} - {windowDays} daily snapshots</Text>
            <WizardFooter onBack={() => setScreen(1)} onNext={() => setScreen(3)} nextLabel="Continue" />
          </WizardStep>
        ) : null}

        {screen === 3 ? (
          <WizardStep step={stepNumber(3)} total={total} title="Anything" accent="specific" body="Optional. Filters which layers get surfaced in the reading; the engine still computes everything.">
            <View style={styles.goalGrid}>
              {activeGoals.map((item) => (
                <GoalTile
                  key={item.id}
                  active={goal === item.id}
                  goal={item}
                  showSub
                  onPress={() => setGoal((current) => (current === item.id ? null : item.id))}
                />
              ))}
            </View>
            <WizardError message={error} />
            <WizardFooter onBack={() => setScreen(2)} onNext={submit} nextDisabled={cities.length === 0} nextLabel="Generate Forecast" />
          </WizardStep>
        ) : null}
      </View>
    </AppScreen>
  );
}

function WizardStep({
  step,
  total,
  title,
  accent,
  accentColor = colors.acqua,
  body,
  children,
}: {
  step: number;
  total: number;
  title: string;
  accent: string;
  accentColor?: string;
  body: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.step}>
      <Text style={styles.stepLabel}>Step {step} of {total}</Text>
      <Text style={styles.stepTitle}>
        {title} <Text style={[styles.titleAccent, { color: accentColor }]}>{accent}</Text>
      </Text>
      <Text style={styles.stepBody}>{body}</Text>
      {children}
    </View>
  );
}

function WizardTextInput({
  label,
  style,
  ...props
}: Omit<TextInputProps, 'style'> & {
  label: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.field, style]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        placeholderTextColor="rgba(248,245,236,0.42)"
        {...props}
        style={styles.fieldInput}
      />
    </View>
  );
}

function OptionRow({
  active,
  icon: Icon,
  mark,
  color,
  title,
  sub,
  onPress,
}: {
  active: boolean;
  icon?: LucideIcon;
  mark?: string;
  color: string;
  title: string;
  sub: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.optionRow, active && { backgroundColor: `${color}14`, borderColor: color }, active && styles.optionRowActive]}>
      <View style={styles.optionIconSlot}>
        {Icon ? (
          <Icon color={active ? color : colors.textTertiary} size={19} strokeWidth={1.9} />
        ) : (
          <Text style={[styles.optionMark, { color }]}>{mark}</Text>
        )}
      </View>
      <View style={styles.optionCopy}>
        <Text style={[styles.optionTitle, active && styles.optionTitleActive]}>{title}</Text>
        <Text style={styles.optionSub}>{sub}</Text>
      </View>
    </Pressable>
  );
}

function GoalTile({
  active,
  disabled,
  goal,
  showSub = false,
  onPress,
}: {
  active: boolean;
  disabled?: boolean;
  goal: { label: string; sub: string; icon: LucideIcon; color: string };
  showSub?: boolean;
  onPress: () => void;
}) {
  const Icon = goal.icon;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.goalTile,
        active && { backgroundColor: `${goal.color}14`, borderColor: goal.color },
        disabled && styles.disabled,
      ]}>
      <Icon color={active ? goal.color : colors.textTertiary} size={20} strokeWidth={1.9} />
      <View style={styles.goalCopy}>
        <Text style={[styles.goalTitle, active && styles.optionTitleActive]}>{goal.label}</Text>
        {showSub ? <Text style={styles.goalSub}>{goal.sub}</Text> : null}
      </View>
    </Pressable>
  );
}

function WizardFooter({
  onBack,
  onNext,
  nextDisabled,
  nextLabel,
}: {
  onBack?: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
  nextLabel: string;
}) {
  return (
    <View style={styles.footer}>
      {onBack ? (
        <Pressable style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </Pressable>
      ) : null}
      <Pressable style={[styles.primaryButton, nextDisabled && styles.disabled]} onPress={onNext} disabled={nextDisabled}>
        <Text style={styles.primaryButtonText}>{nextLabel} →</Text>
      </Pressable>
    </View>
  );
}

function WizardError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <View style={styles.errorBox}>
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
}

function WizardLoading({ label }: { label: string }) {
  return (
    <AppScreen contentStyle={styles.loadingScreen}>
      <View style={styles.loadingRing}>
        <Text style={styles.loadingGlyph}>N</Text>
      </View>
      <MonoLabel>{label}</MonoLabel>
    </AppScreen>
  );
}

function todayISO() {
  return formatISO(new Date());
}

function formatISO(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatAngle(angle: number) {
  const normalized = ((angle % 360) + 360) % 360;
  return `${normalized.toFixed(0)} deg`;
}

const styles = StyleSheet.create({
  screenContent: {
    alignItems: 'center',
    minHeight: '100%',
    paddingBottom: spacing.xxl,
  },
  flowFrame: {
    flex: 1,
    justifyContent: 'center',
    maxWidth: 1080,
    minHeight: 720,
    width: '100%',
  },
  step: {
    gap: 18,
    justifyContent: 'center',
  },
  stepLabel: {
    color: colors.textTertiary,
    fontFamily: fonts.body,
    fontSize: 18,
    letterSpacing: 4,
    lineHeight: 24,
    textTransform: 'uppercase',
  },
  stepTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.display,
    fontSize: 68,
    letterSpacing: 0,
    lineHeight: 73,
    textTransform: 'uppercase',
  },
  titleAccent: {
    color: colors.acqua,
  },
  stepBody: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 22,
    lineHeight: 32,
    marginBottom: 18,
    maxWidth: 900,
  },
  optionStack: {
    gap: spacing.sm,
  },
  optionRow: {
    alignItems: 'center',
    backgroundColor: colors.appSurface,
    borderColor: colors.appBorder,
    borderRadius: radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  optionRowActive: {
    ...radius.asymmetric,
  },
  optionMark: {
    fontFamily: fonts.display,
    fontSize: 24,
    lineHeight: 26,
    textAlign: 'center',
  },
  optionIconSlot: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
  },
  optionCopy: {
    flex: 1,
    gap: 3,
  },
  optionTitle: {
    color: colors.textSecondary,
    fontFamily: fonts.bodyHeavy,
    fontSize: 14,
    lineHeight: 18,
  },
  optionTitleActive: {
    color: colors.textPrimary,
  },
  optionSub: {
    color: colors.textTertiary,
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1,
    lineHeight: 14,
    textTransform: 'uppercase',
  },
  goalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    maxWidth: 880,
  },
  goalTile: {
    alignItems: 'center',
    backgroundColor: colors.appSurface,
    borderColor: colors.appBorder,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    minHeight: 68,
    paddingHorizontal: 18,
    paddingVertical: 14,
    width: '48%',
  },
  goalCopy: {
    flex: 1,
    gap: 3,
  },
  goalTitle: {
    color: colors.textSecondary,
    fontFamily: fonts.bodyHeavy,
    fontSize: 18,
    lineHeight: 22,
  },
  goalSub: {
    color: colors.textTertiary,
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 17,
  },
  inputStack: {
    gap: 28,
    maxWidth: 860,
  },
  destinationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xl,
    justifyContent: 'space-between',
    maxWidth: 860,
  },
  destinationInput: {
    maxWidth: 430,
  },
  field: {
    gap: spacing.xs,
    maxWidth: 860,
    width: '100%',
  },
  fieldLabel: {
    color: colors.textTertiary,
    fontFamily: fonts.body,
    fontSize: 14,
    letterSpacing: 4,
    lineHeight: 20,
    textTransform: 'uppercase',
  },
  fieldInput: {
    borderColor: colors.appBorder,
    borderRadius: 17,
    borderWidth: 1,
    color: colors.textPrimary,
    fontFamily: fonts.body,
    fontSize: 24,
    height: 84,
    lineHeight: 30,
    paddingHorizontal: 32,
  },
  partnerForm: {
    backgroundColor: colors.appSurface,
    borderColor: colors.appBorder,
    borderRadius: radius.sm,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  dashedButton: {
    alignItems: 'center',
    borderColor: colors.appBorder,
    borderRadius: radius.sm,
    borderStyle: 'dashed',
    borderWidth: 1,
    padding: spacing.md,
  },
  dashedButtonText: {
    color: colors.textTertiary,
    fontFamily: fonts.bodyHeavy,
    fontSize: 13,
  },
  cityRow: {
    alignItems: 'center',
    backgroundColor: 'rgba(4,86,251,0.08)',
    borderColor: colors.y2kBlue,
    borderRadius: radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  cityTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.bodyHeavy,
    fontSize: 14,
    lineHeight: 18,
  },
  cityMeta: {
    color: colors.y2kBlue,
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1,
    marginTop: 3,
    textTransform: 'uppercase',
  },
  removeText: {
    color: colors.textTertiary,
    fontFamily: fonts.bodyHeavy,
    fontSize: 12,
  },
  dateRange: {
    color: colors.textTertiary,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.2,
    lineHeight: 15,
    textTransform: 'uppercase',
  },
  footer: {
    alignItems: 'stretch',
    flexDirection: 'row',
    gap: 18,
    marginTop: 28,
    maxWidth: 860,
  },
  backButton: {
    alignItems: 'center',
    borderColor: colors.eggshell,
    borderRadius: 18,
    borderWidth: 1.5,
    justifyContent: 'center',
    minHeight: 72,
    minWidth: 158,
    paddingHorizontal: spacing.xl,
  },
  backButtonText: {
    color: colors.eggshell,
    fontFamily: fonts.body,
    fontSize: 22,
    letterSpacing: 1.5,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.y2kBlue,
    flex: 1,
    justifyContent: 'center',
    minHeight: 72,
    paddingHorizontal: spacing.lg,
    ...{
      borderTopLeftRadius: 30,
      borderTopRightRadius: 8,
      borderBottomRightRadius: 30,
      borderBottomLeftRadius: 8,
    },
  },
  primaryButtonText: {
    color: colors.textTertiary,
    fontFamily: fonts.body,
    fontSize: 22,
    letterSpacing: 1.8,
    textAlign: 'center',
  },
  secondaryFullButton: {
    alignItems: 'center',
    borderColor: colors.appBorder,
    borderRadius: radius.sm,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: 'center',
  },
  secondaryFullButtonText: {
    color: colors.textSecondary,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  linkText: {
    color: colors.textTertiary,
    fontFamily: fonts.bodyHeavy,
    fontSize: 12,
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.35,
  },
  errorBox: {
    backgroundColor: 'rgba(230,122,122,0.1)',
    borderColor: 'rgba(230,122,122,0.35)',
    borderRadius: radius.sm,
    borderWidth: 1,
    padding: spacing.md,
  },
  errorText: {
    color: colors.spicedLife,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  backgroundScript: {
    color: colors.y2kBlue,
    fontFamily: fonts.script,
    fontSize: 112,
    lineHeight: 112,
    opacity: 0.11,
    position: 'absolute',
    right: -30,
    top: 70,
  },
  loadingScreen: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100%',
  },
  loadingRing: {
    alignItems: 'center',
    borderColor: colors.gold,
    borderRadius: 999,
    borderWidth: 1,
    height: 130,
    justifyContent: 'center',
    marginBottom: spacing.lg,
    width: 130,
  },
  loadingGlyph: {
    color: colors.acqua,
    fontFamily: fonts.display,
    fontSize: 76,
    lineHeight: 80,
  },
});
