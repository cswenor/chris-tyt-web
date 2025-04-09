import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import algosdk from 'algosdk'
import { CONFIG } from '@/config'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatAddress(address: string, length: number = 6): string {
  if (!address) return ''
  if (address.length <= length * 2) return address
  return `${address.slice(0, length)}...${address.slice(-length)}`
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num)
}

export const algodClient = new algosdk.Algodv2(
  '',
  CONFIG.APIS.VOI_NODE,
  ''
)

export async function getVoiBalance(address: string): Promise<number> {
  try {
    const accountInfo = await algodClient.accountInformation(address).do()
    return Number(accountInfo.amount) / 1_000_000
  } catch (err) {
    console.error('Error fetching VOI balance:', err)
    return 0
  }
}

export async function fetchVoiName(address: string): Promise<string | null> {
  try {
    const response = await fetch(`https://api.envoi.sh/api/name/${address}`)
    // if (!response.ok) {
    //   console.error(`Failed to fetch .voi name for address: ${address}`)
    //   return null
    // }
    const data = await response.json()
    const result = data.results?.[0]?.name || null
    return result
  } catch (error) {
    console.error(`Error fetching .voi name: ${error}`)
    return null
  }
}

export function isApplicationAddress(address: string, appId: number): boolean {
  if (!algosdk.isValidAddress(address)) {
    return false;
  }

  const expectedAppAddress = algosdk.getApplicationAddress(appId);

  return address === expectedAppAddress.toString();
}