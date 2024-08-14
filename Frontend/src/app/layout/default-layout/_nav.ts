import { INavData } from '@coreui/angular';

export const navItems: INavData[] = [
  {
    name: 'Calendario',
    url: '/calendario',
    iconComponent: { name: 'cil-calendar' }
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
