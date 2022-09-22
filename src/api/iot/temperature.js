import request from '@/utils/request'

export function temperatureAdd(data) {
  return request({
    url: '/api/mqUserSub?topic=' + data,
    method: 'post',
    data
  })
}

export function temperatureDel(data) {
  return request({
    url: '/api/mqUserSub?topic=' + data,
    method: 'delete'
  })
}
export function temperatureSearch() {
  return request({
    url: '/api/mqUserSub',
    method: 'get'
  })
}
