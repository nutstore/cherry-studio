import { SettingDivider, SettingGroup, SettingRow, SettingRowTitle, SettingTitle } from '..'
import { useTranslation } from 'react-i18next'
import { FC, useCallback, useEffect, useState } from 'react'
import { HStack } from '@renderer/components/Layout'
import { Button, Input, Select, Typography } from 'antd'
import { useTheme } from '@renderer/context/ThemeProvider'
import { decryptToken, nutstoreSsoLogin } from '@renderer/integration/nutstore/sso'
import { useSettings } from '@renderer/hooks/useSettings'
import { useAppDispatch } from '@renderer/store'
import {
  setNutstoreToken,
  setNutstorePath,
  setNutstoreAutoSync,
  setNutstoreSyncInterval
} from '@renderer/store/settings'
import { useNutstoreSSO } from '@renderer/integration/nutstore'
import { modalConfirm } from '@renderer/utils'
import {
  backupToNutstore,
  checkConnection,
  restoreFromNutstore,
  startNutstoreAutoSync,
  stopNutstoreAutoSync
} from '@renderer/services/NutstoreService'
import { CheckOutlined, LoadingOutlined, SyncOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

const NutstoreSettings: FC = () => {
  const { theme } = useTheme()
  const { t } = useTranslation()
  const { nutstoreToken, nutstorePath, nutstoreSyncInterval, nutstoreAutoSync, nutstoreSyncRuntime } = useSettings()

  const dispatch = useAppDispatch()

  const [nutstoreUsername, setNutstoreUsername] = useState('')
  const [storagePath, setStoragePath] = useState<string | undefined>(nutstorePath)

  const [checkConnectionLoading, setCheckConnectionLoading] = useState(false)
  const [nsConnected, setNsConnected] = useState<boolean>(false)

  const [backuping, setBackuping] = useState(false)
  const [restoring, setRestoring] = useState(false)

  const [syncInterval, setSyncInterval] = useState<number>(nutstoreSyncInterval)

  const nutstoreSSOHandler = useNutstoreSSO()

  const handleClickNutstoreSSO = useCallback(async () => {
    nutstoreSsoLogin()
    const nutstoreToken = await nutstoreSSOHandler()
    dispatch(setNutstoreToken(nutstoreToken))
  }, [])

  useEffect(() => {
    async function decryptTokenEffect() {
      if (nutstoreToken) {
        const decrypted = await decryptToken(nutstoreToken)
        if (decrypted) {
          setNutstoreUsername(decrypted.username)
          if (!nutstorePath) {
            dispatch(setNutstorePath('/cherry-studio'))
            setStoragePath('/cherry-studio')
          }
        }
      }
    }
    decryptTokenEffect()
  }, [nutstoreToken])

  const handleLayout = useCallback(async () => {
    const confirmedLogout = await modalConfirm({
      title: t('settings.data.nutstore.logout.title'),
      content: t('settings.data.nutstore.logout.content')
    })
    if (confirmedLogout) {
      dispatch(setNutstoreToken(''))
      dispatch(setNutstorePath(''))
      setNutstoreUsername('')
      setStoragePath(undefined)
    }
  }, [])

  const handleCheckConnection = async () => {
    if (!nutstoreToken) return
    setCheckConnectionLoading(true)
    const isConnectedToNutstore = await checkConnection()

    window.message[isConnectedToNutstore ? 'success' : 'error']({
      key: 'api-check',
      style: { marginTop: '3vh' },
      duration: 2,
      content: isConnectedToNutstore
        ? t('settings.data.nutstore.checkConnection.success')
        : t('settings.data.nutstore.checkConnection.fail')
    })

    setNsConnected(isConnectedToNutstore)
    setCheckConnectionLoading(false)

    setTimeout(() => setNsConnected(false), 3000)
  }

  const handleBackup = async () => {
    setBackuping(true)
    await backupToNutstore({ showMessage: true })
    setBackuping(false)
  }

  const handleRestore = async () => {
    setRestoring(true)
    await restoreFromNutstore()
    setRestoring(false)
  }

  const onSyncIntervalChange = (value: number) => {
    setSyncInterval(value)
    dispatch(setNutstoreSyncInterval(value))
    if (value === 0) {
      dispatch(setNutstoreAutoSync(false))
      stopNutstoreAutoSync()
    } else {
      dispatch(setNutstoreAutoSync(true))
      startNutstoreAutoSync()
    }
  }

  const renderSyncStatus = () => {
    if (!nutstoreSyncRuntime.lastSyncTime && !nutstoreSyncRuntime.syncing && !nutstoreSyncRuntime.lastSyncError) {
      return <span style={{ color: 'var(--text-secondary)' }}>{t('settings.data.webdav.noSync')}</span>
    }

    return (
      <HStack gap="5px" alignItems="center">
        {nutstoreSyncRuntime.syncing && <SyncOutlined spin />}
        {nutstoreSyncRuntime.lastSyncTime && (
          <span style={{ color: 'var(--text-secondary)' }}>
            {t('settings.data.webdav.lastSync')}: {dayjs(nutstoreSyncRuntime.lastSyncTime).format('HH:mm:ss')}
          </span>
        )}
        {nutstoreSyncRuntime.lastSyncError && (
          <span style={{ color: 'var(--error-color)' }}>
            {t('settings.data.webdav.syncError')}: {nutstoreSyncRuntime.lastSyncError}
          </span>
        )}
      </HStack>
    )
  }

  const isLogin = nutstoreToken && nutstoreUsername

  return (
    <SettingGroup theme={theme}>
      <SettingTitle>{t('settings.data.nutstore.title')}</SettingTitle>
      <SettingDivider />
      <SettingRow>
        <SettingRowTitle>
          {isLogin ? t('settings.data.nutstore.isLogin') : t('settings.data.nutstore.notLogin')}
        </SettingRowTitle>
        {isLogin ? (
          <HStack gap="5px" justifyContent="space-between" alignItems="center">
            <Button
              type={nsConnected ? 'primary' : 'default'}
              ghost={nsConnected}
              onClick={handleCheckConnection}
              loading={checkConnectionLoading}>
              {checkConnectionLoading ? (
                <LoadingOutlined spin />
              ) : nsConnected ? (
                <CheckOutlined />
              ) : (
                t('settings.data.nutstore.checkConnection.name')
              )}
            </Button>
            <Button type="primary" danger onClick={handleLayout}>
              {t('settings.data.nutstore.logout.button')}
            </Button>
          </HStack>
        ) : (
          <Button onClick={handleClickNutstoreSSO}>{t('settings.data.nutstore.login.button')}</Button>
        )}
      </SettingRow>
      <SettingDivider />
      {isLogin && (
        <>
          <SettingRow>
            <SettingRowTitle>{t('settings.data.nutstore.username')}</SettingRowTitle>
            <Typography.Text style={{ color: 'var(--color-text-3)' }}>{nutstoreUsername}</Typography.Text>
          </SettingRow>

          <SettingDivider />
          <SettingRow>
            <SettingRowTitle>{t('settings.data.nutstore.path')}</SettingRowTitle>
            <Input
              placeholder={t('settings.data.nutstore.path.placeholder')}
              style={{ width: 250 }}
              value={nutstorePath}
              onChange={(e) => setStoragePath(e.target.value)}
              onBlur={() => dispatch(setNutstorePath(storagePath || ''))}
            />
          </SettingRow>
          <SettingDivider />
          <SettingRow>
            <SettingRowTitle>{t('settings.general.backup.title')}</SettingRowTitle>
            <HStack gap="5px" justifyContent="space-between">
              <Button onClick={handleBackup} loading={backuping}>
                {t('settings.data.nutstore.backup.button')}
              </Button>
              <Button onClick={handleRestore} loading={restoring}>
                {t('settings.data.nutstore.restore.button')}
              </Button>
            </HStack>
          </SettingRow>
          <SettingDivider />
          <SettingRow>
            <SettingRowTitle>{t('settings.data.webdav.autoSync')}</SettingRowTitle>
            <Select value={syncInterval} onChange={onSyncIntervalChange} style={{ width: 120 }}>
              <Select.Option value={0}>{t('settings.data.webdav.autoSync.off')}</Select.Option>
              <Select.Option value={1}>{t('settings.data.webdav.minute_interval', { count: 1 })}</Select.Option>
              <Select.Option value={5}>{t('settings.data.webdav.minute_interval', { count: 5 })}</Select.Option>
              <Select.Option value={15}>{t('settings.data.webdav.minute_interval', { count: 15 })}</Select.Option>
              <Select.Option value={30}>{t('settings.data.webdav.minute_interval', { count: 30 })}</Select.Option>
              <Select.Option value={60}>{t('settings.data.webdav.hour_interval', { count: 1 })}</Select.Option>
              <Select.Option value={120}>{t('settings.data.webdav.hour_interval', { count: 2 })}</Select.Option>
              <Select.Option value={360}>{t('settings.data.webdav.hour_interval', { count: 6 })}</Select.Option>
              <Select.Option value={720}>{t('settings.data.webdav.hour_interval', { count: 12 })}</Select.Option>
              <Select.Option value={1440}>{t('settings.data.webdav.hour_interval', { count: 24 })}</Select.Option>
            </Select>
          </SettingRow>
          {nutstoreAutoSync && syncInterval > 0 && (
            <>
              <SettingDivider />
              <SettingRow>
                <SettingRowTitle>{t('settings.data.webdav.syncStatus')}</SettingRowTitle>
                {renderSyncStatus()}
              </SettingRow>
            </>
          )}
        </>
      )}
    </SettingGroup>
  )
}

export default NutstoreSettings
