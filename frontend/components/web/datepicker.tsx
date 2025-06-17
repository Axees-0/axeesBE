import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
  Dimensions,
  LayoutRectangle,
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import moment, { Moment } from 'moment';
import Icon from 'react-native-vector-icons/Feather';

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

type Range = { start?: Moment; end?: Moment };

const presets = [
  { label: 'Last 31 days',  start: moment().subtract(30, 'days'), end: moment() },
  { label: 'Current month', start: moment().startOf('month'),     end: moment() },
  {
    label: 'Previous month',
    start: moment().subtract(1, 'month').startOf('month'),
    end:   moment().subtract(1, 'month').endOf('month'),
  }
] as const;

interface Props {
  onConfirm: (range: { startDate: string; endDate: string }) => void;
}

export default function DateRangeDropdown({ onConfirm }: Props) {
  const [range, setRange] = useState<Range>({
    start: moment().startOf('isoWeek'),
    end: moment().endOf('isoWeek'),
  });
  const [hasUserSelected, setHasUserSelected] = useState(false);
  const [open, setOpen] = useState(false);
  const [showCalendar, setShowCal] = useState(false);
  const [anchor, setAnchor] = useState<LayoutRectangle | null>(null);
  const buttonRef = useRef<View>(null);
  const [weekStart, setWeekStart] = useState(moment().startOf('isoWeek'));
  const getWeekDays = (startOfWeek: Moment) =>
    [...Array(7)].map((_, i) => moment(startOfWeek).add(i, 'days'));
  
  const formatShort = () =>
    `${range.start!.format('MMM D, YYYY')} – ${range.end!.format('MMM D, YYYY')}`;

  // const isPresetActive = (p: (typeof presets)[number]) =>
  //   range.start?.isSame(p.start, 'day') && range.end?.isSame(p.end, 'day');

  // const applyPreset = (p: (typeof presets)[number]) => {
  //   setRange({ start: p.start, end: p.end });
  //   setShowCal(false);
  // };

  const marked = useMemo(() => {
    const marks: Record<string, any> = {};
    if (!range.start || !range.end) return marks;

    for (const m = range.start.clone(); m.diff(range.end, 'days') <= 0; m.add(1, 'day')) {
      marks[m.format('YYYY-MM-DD')] = {
        startingDay: m.isSame(range.start, 'day'),
        endingDay: m.isSame(range.end, 'day'),
        color: '#430B92',
        textColor: '#fff',
      };
    }
    return marks;
  }, [range]);

  const handleDay = (d: DateData) => {
    const tapped = moment(d.dateString);
    const startOfWeek = tapped.clone().startOf('isoWeek'); // Monday
    const endOfWeek = tapped.clone().endOf('isoWeek');     // Sunday
  
    setRange({ start: startOfWeek, end: endOfWeek });
    setShowCal(false); // Optionally close calendar
  };
  
  

  const openDropdown = () => {
    buttonRef.current?.measureInWindow((x, y, w, h) => {
      setAnchor({ x, y, width: w, height: h });
      setWeekStart(moment().startOf('isoWeek')); // 👈 Reset to current week on open
      setOpen(true);
    });
  };
  

  return (
    <>
      <TouchableOpacity ref={buttonRef} style={s.inputButton} onPress={openDropdown}>
        <Text style={s.inputText}>{formatShort()}</Text>
        <Icon name="calendar" size={18} color="#000" />
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => { setOpen(false); setShowCal(false); }}
      >
        <Pressable style={s.backdrop} onPress={() => setOpen(false)} />

        {anchor && (
          <View
            style={[
              s.card,
              {
                top: anchor.y + anchor.height + 6,
                left: anchor.x,
                maxWidth: Math.min(Dimensions.get('window').width - anchor.x - 10, 480),
              },
            ]}
          >
<View style={s.weekContainer}>
  <View style={s.headerRow}>
    <TouchableOpacity onPress={() => setWeekStart(weekStart.clone().subtract(1, 'week'))}>
      <Icon name="chevron-left" size={20} color="#fff" />
    </TouchableOpacity>
    <Text style={s.monthLabel}>
      {weekStart.format('MMMM')} / {weekStart.clone().add(6, 'days').format('MMMM YYYY')}
    </Text>
    <TouchableOpacity
  onPress={() => {
    const nextWeekStart = weekStart.clone().add(1, 'week');
    if (nextWeekStart.isSameOrBefore(moment(), 'week')) {
      setWeekStart(nextWeekStart);
    }
  }}
>
  <Icon name="chevron-right" size={20} color="#fff" />
</TouchableOpacity>

  </View>

  <View style={s.weekRow}>
  {getWeekDays(weekStart).map(day => {
  const isFuture = day.isAfter(moment(), 'day');
  const isActive = range.start?.isSame(day, 'day') && range.end?.isSame(day, 'day');

  return (
    <TouchableOpacity
      key={day.format('YYYY-MM-DD')}
      style={[s.dayBox, isActive && s.dayBoxActive, isFuture && { opacity: 0.3 }]}
      disabled={isFuture}
      onPress={() => {
        const startOfWeek = day.clone().startOf('isoWeek');
        const endOfWeek = day.clone().endOf('isoWeek');
        setRange({ start: startOfWeek, end: endOfWeek });
        setShowCal(false);
      }}
    >
      <Text style={s.dayLabel}>{day.format('ddd').toUpperCase()}</Text>
      <Text style={[s.dayNum, isActive && s.dayNumActive]}>{day.format('D')}</Text>
    </TouchableOpacity>
  );
})}

  </View>
</View>

            {/* <ScrollView style={s.presetList}>
              {presets.map(p => (
                <TouchableOpacity key={p.label} style={s.presetRow} onPress={() => applyPreset(p)}>
                  {isPresetActive(p) && <Icon name="check" size={16} color="#430B92" />}
                  <View style={{ marginLeft: isPresetActive(p) ? 6 : 22 }}>
                    <Text style={s.presetLabel}>{p.label}</Text>
                    <Text style={s.presetDates}>
                      {p.start.format('MMM D, YYYY')} – {p.end.format('MMM D, YYYY')}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView> */}

            {showCalendar && (
             <Calendar
             onDayPress={handleDay}
             markedDates={marked}
             markingType="period"
             firstDay={1}
             maxDate={moment().format('YYYY-MM-DD')} // Disables future dates
             style={s.calendar}
             theme={{
               calendarBackground: '#fff',
               todayTextColor: '#430B92',
               arrowColor: '#430B92',
             }}
           />
           
            )}

            <View style={s.footer}>
              <View style={s.smallBox}>
                <Text style={s.smallText}>{range.start?.format('MMM D, YYYY') || 'Start'}</Text>
              </View>
              <View style={s.smallBox}>
                <Text style={s.smallText}>{range.end?.format('MMM D, YYYY') || 'End'}</Text>
              </View>
              <TouchableOpacity
                style={[s.confirm, !(range.start && range.end) && { opacity: 0.4 }]}
                disabled={!(range.start && range.end)}
                onPress={() => {
                  const now = moment();
                  //if (range.end && range.end.isAfter(now, 'day')) return;
                
                  setHasUserSelected(true); // User has interacted
                
                  onConfirm({
                    startDate: range.start!.format('YYYY-MM-DD'),
                    endDate: range.end!.format('YYYY-MM-DD'),
                  });
                
                  setOpen(false);
                  setShowCal(false);
                }}
                
                
              >
                <Icon name="arrow-right" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  inputButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    minWidth: 240,
    maxWidth: 260,
  },
  inputText: { flex: 1, fontSize: 14, color: '#000', marginRight: 8 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  card: {
    position: 'absolute',
    width: 480,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 8,
  },
  weekStrip: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    gap: 8,
  },
  weekBox: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#eee',
  },
  weekBoxActive: {
    backgroundColor: '#430B92',
  },
  weekText: {
    fontSize: 13,
    color: '#000',
  },
  weekTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  presetList: { maxHeight: 180 },
  presetRow: { flexDirection: 'row', alignItems: 'flex-start', padding: 12 },
  presetLabel: { fontSize: 15, color: '#000' },
  presetDates: { fontSize: 12, color: '#6C6C6C', marginTop: 2 },
  calendar: { height: 300, borderTopWidth: 1, borderColor: '#eee' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderColor: '#eee',
  },
  weekContainer: {
    backgroundColor: '#7E57C2',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  monthLabel: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayBox: {
    alignItems: 'center',
    paddingHorizontal: 6,
    flex: 1,
  },
  dayLabel: {
    fontSize: 11,
    color: '#E0E0E0',
    marginBottom: 4,
  },
  dayNum: {
    fontSize: 16,
    color: '#fff',
  },
  dayBoxActive: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 4,
    width: 36,
    alignSelf: 'center',
  },
  dayNumActive: {
    color: '#430B92',
    fontWeight: 'bold',
  },
  
  smallBox: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 6, padding: 6, marginRight: 8 },
  smallText: { fontSize: 12, color: '#000' },
  confirm: { backgroundColor: '#1DB954', width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
