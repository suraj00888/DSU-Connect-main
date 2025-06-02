import React, { useState, useEffect } from 'react';
import { X, Check, Users, UserCheck, UserX, Save, RefreshCw, QrCode } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import eventsApi from '../api/eventsApi';
import { toast } from 'react-hot-toast';
import QRScanner from './QRScanner';

const AttendanceModal = ({ isOpen, onClose, event, onAttendanceUpdate }) => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const [scanningQR, setScanningQR] = useState(false);

  // Fetch attendance data when modal opens
  useEffect(() => {
    if (isOpen && event?._id) {
      fetchAttendanceData();
    }
  }, [isOpen, event?._id]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const data = await eventsApi.getAttendanceList(event._id);
      setAttendanceData(data.attendees || []);
    } catch (error) {
      console.error('Failed to fetch attendance data:', error);
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  // Filter attendees based on search term
  const filteredAttendees = attendanceData.filter(attendee =>
    attendee.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle individual attendance toggle
  const handleAttendanceToggle = (userId, currentStatus) => {
    setAttendanceData(prev =>
      prev.map(attendee =>
        attendee.userId === userId
          ? { ...attendee, attended: !currentStatus }
          : attendee
      )
    );
  };

  // Mark all as present
  const markAllPresent = () => {
    setAttendanceData(prev =>
      prev.map(attendee => ({ ...attendee, attended: true }))
    );
  };

  // Mark all as absent
  const markAllAbsent = () => {
    setAttendanceData(prev =>
      prev.map(attendee => ({ ...attendee, attended: false }))
    );
  };

  // Save attendance changes
  const saveAttendance = async () => {
    try {
      setSaving(true);
      
      // Prepare bulk attendance data
      const bulkData = attendanceData.map(attendee => ({
        userId: attendee.userId,
        attended: attendee.attended
      }));

      const result = await eventsApi.bulkMarkAttendance(event._id, bulkData);
      
      toast.success('Attendance saved successfully');
      
      // Notify parent component
      if (onAttendanceUpdate) {
        onAttendanceUpdate(result.stats);
      }
      
    } catch (error) {
      console.error('Failed to save attendance:', error);
      toast.error(error.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  // Handle QR code scan
  const handleQRScan = async (qrData) => {
    try {
      setScanningQR(true);
      setQrScannerOpen(false);
      
      // Mark attendance using QR code
      const result = await eventsApi.markAttendanceByQR(event._id, qrData);
      
      toast.success(result.message);
      
      // Refresh attendance data
      await fetchAttendanceData();
      
    } catch (error) {
      console.error('Failed to mark attendance by QR:', error);
      toast.error(error.message || 'Failed to mark attendance');
    } finally {
      setScanningQR(false);
    }
  };

  // Open QR scanner
  const openQRScanner = () => {
    setQrScannerOpen(true);
  };

  // Close QR scanner
  const closeQRScanner = () => {
    setQrScannerOpen(false);
  };

  // Calculate current stats from local data
  const currentStats = {
    totalRegistered: attendanceData.length,
    totalAttended: attendanceData.filter(a => a.attended).length,
    attendanceRate: attendanceData.length > 0 
      ? Math.round((attendanceData.filter(a => a.attended).length / attendanceData.length) * 100)
      : 0
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Mark Attendance</h2>
            <p className="text-sm text-gray-600 mt-1">{event?.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Stats */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{currentStats.totalRegistered}</div>
              <div className="text-sm text-gray-600">Total Registered</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{currentStats.totalAttended}</div>
              <div className="text-sm text-gray-600">Present</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{currentStats.attendanceRate}%</div>
              <div className="text-sm text-gray-600">Attendance Rate</div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <Input
                type="text"
                placeholder="Search attendees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Bulk Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={openQRScanner}
                disabled={loading || scanningQR}
              >
                <QrCode className="h-4 w-4 mr-2" />
                {scanningQR ? 'Processing...' : 'Scan QR'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={markAllPresent}
                disabled={loading}
              >
                <UserCheck className="h-4 w-4 mr-2" />
                Mark All Present
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAbsent}
                disabled={loading}
              >
                <UserX className="h-4 w-4 mr-2" />
                Mark All Absent
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchAttendanceData}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Attendee List */}
        <div className="flex-1 overflow-y-auto max-h-96">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading attendance data...</span>
            </div>
          ) : filteredAttendees.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {searchTerm ? 'No attendees match your search' : 'No attendees registered for this event'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredAttendees.map((attendee) => (
                <div
                  key={attendee.userId}
                  className="flex items-center justify-between p-4 hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {attendee.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{attendee.name}</p>
                      <p className="text-sm text-gray-500">
                        Registered: {new Date(attendee.registeredAt).toLocaleDateString()}
                      </p>
                      {attendee.attendedAt && (
                        <p className="text-sm text-green-600">
                          Attended: {new Date(attendee.attendedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Label htmlFor={`attendance-${attendee.userId}`} className="text-sm">
                      Present
                    </Label>
                    <input
                      id={`attendance-${attendee.userId}`}
                      type="checkbox"
                      checked={attendee.attended}
                      onChange={() => handleAttendanceToggle(attendee.userId, attendee.attended)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {currentStats.totalAttended} of {currentStats.totalRegistered} attendees marked as present
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={saveAttendance} disabled={saving || loading}>
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Attendance
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
      
      {/* QR Scanner Modal */}
      <QRScanner
        isOpen={qrScannerOpen}
        onClose={closeQRScanner}
        onScan={handleQRScan}
        eventId={event?._id}
      />
    </div>
  );
};

export default AttendanceModal; 