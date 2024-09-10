import { INavData } from '@coreui/angular';

export const navItems: INavData[] = [
  {
    name: 'Calendario',
    url: '/calendario',
    iconComponent: { name: 'cil-calendar' }
  },
  {
    name: 'Flujo de caja',
    iconComponent: { name: 'cil-cash' },
    url: '/flujo_de_caja'
  },
  {
    name: 'Extracto',
    iconComponent: { name: 'cil-bank' },
    url: '/extracto'
  },
  {
    name: 'Tabla',
    url: '/tabla',
    linkProps: { fragment: 'headings' },
    iconComponent: { name: 'cil-list' }
  },
  {
    name: 'Usuarios',
    iconComponent: { name: 'cil-user' },
    url: '/register'
  }
    ]
