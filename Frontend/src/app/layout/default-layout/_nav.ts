import { INavData } from '@coreui/angular';

export const navItems: INavData[] = [

  {
    name: 'Flujo de caja',
    iconComponent: { name: 'cil-bar-chart' },
    url: '/flujo_de_caja'
  },
  {
    name: 'Facturas Consolidadas',
    url: '/facturas',
    linkProps: { fragment: 'headings' },
    iconComponent: { name: 'cil-check' }
  },
  {
    name: 'Facturas Pendientes',
    url: '/tabla',
    linkProps: { fragment: 'headings' },
    iconComponent: { name: 'cil-cash' }
  },
  {
    name: 'Proyecciones',
    url: '/proyectaods',
    linkProps: { fragment: 'headings' },
    iconComponent: { name: 'cilChartLine' }
  },
  {
    name: 'Calendario',
    url: '/calendario',
    iconComponent: { name: 'cil-calendar' }
  },
  {
    name: 'Extracto',
    iconComponent: { name: 'cil-bank' },
    url: '/extracto'
  },
  {
    name: 'Usuarios',
    iconComponent: { name: 'cil-user' },
    url: '/usuarios'
  }
    ]
