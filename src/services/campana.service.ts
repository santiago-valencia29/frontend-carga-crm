import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
// import { Ferreteria } from '../../models/dyrcocinas/ferreteria.model';
import { ClienteCrm } from '../models/cliente-crm.model';

@Injectable({
    providedIn: 'root'
  })

  export class CampanaService {
        url='http://localhost:3000/';
        headers = new HttpHeaders().set('Content-Type','application/json');

        constructor(private _http: HttpClient){}

        getLatestCampana(): Observable<any>{
            return this._http.get(this.url+'campana-cliente',{headers: this.headers});
        }

        saveClientesCrm(clienteCrm: ClienteCrm): Observable<any>{
            let params = JSON.stringify(clienteCrm);
            return this._http.post(this.url+'clientecrm/save-clientecrm',params,{headers: this.headers});
        }
  }
