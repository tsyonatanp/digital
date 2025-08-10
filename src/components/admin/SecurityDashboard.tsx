'use client'

import React, { useState, useEffect } from 'react'
import { logger } from '../../lib/logger'
import { Shield, AlertTriangle, Eye, Clock, Users, FileText } from 'lucide-react'

interface SecurityStats {
  totalEvents: number
  securityEvents: number
  failedLogins: number
  rateLimitViolations: number
  fileUploads: number
  recentEvents: any[]
}

export default function SecurityDashboard() {
  const [stats, setStats] = useState<SecurityStats>({
    totalEvents: 0,
    securityEvents: 0,
    failedLogins: 0,
    rateLimitViolations: 0,
    fileUploads: 0,
    recentEvents: []
  })

  useEffect(() => {
    updateStats()
    
    // עדכן כל 30 שניות
    const interval = setInterval(updateStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const updateStats = () => {
    const logs = logger.getLogs()
    const securityEvents = logger.getSecurityEvents()
    
    setStats({
      totalEvents: logs.length,
      securityEvents: securityEvents.length,
      failedLogins: securityEvents.filter(e => e.message.includes('Failed login')).length,
      rateLimitViolations: securityEvents.filter(e => e.message.includes('Rate limit')).length,
      fileUploads: logs.filter(e => e.message.includes('File uploaded')).length,
      recentEvents: logs.slice(-10).reverse() // 10 אירועים אחרונים
    })
  }

  const getEventIcon = (level: string) => {
    switch (level) {
      case 'security':
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />
      case 'warn':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      default:
        return <Eye className="w-4 h-4 text-blue-500" />
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('he-IL')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="w-8 h-8 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Security Dashboard</h2>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">סה"כ אירועים</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalEvents}</p>
            </div>
            <Eye className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">אירועי אבטחה</p>
              <p className="text-2xl font-bold text-red-600">{stats.securityEvents}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">התחברויות כושלות</p>
              <p className="text-2xl font-bold text-orange-600">{stats.failedLogins}</p>
            </div>
            <Users className="w-8 h-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">חריגות מגבלת קצב</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.rateLimitViolations}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">העלאת קבצים</p>
              <p className="text-2xl font-bold text-green-600">{stats.fileUploads}</p>
            </div>
            <FileText className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Recent Events */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">אירועים אחרונים</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {stats.recentEvents.length === 0 ? (
            <div className="px-6 py-4 text-center text-gray-500">
              אין אירועים להצגה
            </div>
          ) : (
            stats.recentEvents.map((event, index) => (
              <div key={index} className="px-6 py-4">
                <div className="flex items-center gap-3">
                  {getEventIcon(event.level)}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{event.message}</p>
                    <p className="text-xs text-gray-500">
                      {formatTimestamp(event.timestamp)}
                      {event.ip && ` • IP: ${event.ip}`}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    event.level === 'security' ? 'bg-red-100 text-red-800' :
                    event.level === 'error' ? 'bg-orange-100 text-orange-800' :
                    event.level === 'warn' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {event.level}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={updateStats}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          רענן נתונים
        </button>
        <button
          onClick={() => {
            const logs = logger.getLogs()
            const dataStr = JSON.stringify(logs, null, 2)
            const dataBlob = new Blob([dataStr], { type: 'application/json' })
            const url = URL.createObjectURL(dataBlob)
            const link = document.createElement('a')
            link.href = url
            link.download = `security-logs-${new Date().toISOString().split('T')[0]}.json`
            link.click()
          }}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
        >
          ייצא לוגים
        </button>
      </div>
    </div>
  )
}
