import { useNutstoreSSO } from '@renderer/hooks/useNutstoreSSO'
import { useProvider } from '@renderer/hooks/useProvider'
import { useAppDispatch, useAppSelector } from '@renderer/store'
import { setNutstoreToken } from '@renderer/store/nutstore'
import { isDev } from '@renderer/utils'
import { Button, Space, Typography } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { SettingHelpTextRow, SettingSubtitle } from '..'

export function NutstoreSettings({ setApiKey }: { setApiKey: (apiKey: string) => void }) {
  const { t } = useTranslation()

  const dispatch = useAppDispatch()
  const { nutstoreToken } = useAppSelector((state) => state.nutstore)

  const { provider, updateProvider } = useProvider('nutstore')

  const [nutstoreUsername, setNutstoreUsername] = useState('')
  const [nutstorePassword, setNutstorePassword] = useState('')

  const nutstoreSSOHandler = useNutstoreSSO()

  const handleClickNutstoreSSO = async () => {
    const ssoUrl = await window.api.nutstore.getSSOUrl()
    window.open(ssoUrl, '_blank')
    const nutstoreToken = await nutstoreSSOHandler()

    dispatch(setNutstoreToken(nutstoreToken))
  }

  const handleRefreshLLMApiKey = useCallback(async () => {
    const llmOAuthUrl = await window.api.nutstore.getLLMOAuthUrl(nutstorePassword, nutstoreUsername)
    const res = await fetch(llmOAuthUrl)
    const data = (await res.json()) as { access_token: string }

    setApiKey(data.access_token)

    updateProvider({
      ...provider,
      apiKey: data.access_token,
      apiHost: (await isDev())
        ? 'http://localhost.eo2suite.cn:9000/cherrystudio/llm-router/'
        : 'https://webdav-connect.jianguoyun.net.cn/cherrystudio/llm-router/'
    })
  }, [provider, updateProvider, nutstorePassword, nutstoreUsername])

  useEffect(() => {
    async function decryptTokenEffect() {
      if (nutstoreToken) {
        const decrypted = await window.api.nutstore.decryptToken(nutstoreToken)
        setNutstoreUsername(decrypted.username)
        setNutstorePassword(decrypted.access_token)
      }
    }

    decryptTokenEffect()
  }, [nutstoreToken])

  return (
    <div>
      <SettingSubtitle style={{ marginBottom: 5 }}>{t('nutstore.title')}</SettingSubtitle>
      {!nutstoreToken ? (
        <SettingHelpTextRow style={{ justifyContent: 'space-between' }}>
          <span>{t('nutstore.unlogin')}</span>
          <Button onClick={handleClickNutstoreSSO}>{t('settings.data.nutstore.login.button')}</Button>
        </SettingHelpTextRow>
      ) : (
        <SettingHelpTextRow style={{ justifyContent: 'space-between' }}>
          <Space>
            <span>{t('settings.data.nutstore.username')}</span>
            <Typography.Text style={{ color: 'var(--color-text-3)' }}>{nutstoreUsername}</Typography.Text>
          </Space>
          <Button type="primary" onClick={handleRefreshLLMApiKey}>
            {t('nutstore.refresh_api.button')}
          </Button>
        </SettingHelpTextRow>
      )}
    </div>
  )
}
