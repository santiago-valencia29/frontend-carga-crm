import { Component, OnInit, ViewChild } from '@angular/core';
import { Papa } from 'ngx-papaparse';
import { NgForm, FormGroup, FormBuilder, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { CampanaService } from '../services/campana.service';
import { ClienteCrm } from '../models/cliente-crm.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'prueba-carga-crm';
  anio: number;

  @ViewChild('stepper') stepper;

  isLinear = true;
  firstFormGroup: FormGroup;
  secondFormGroup: FormGroup;

  fields: [];
  dataFile: any;
  strFile: any;
  nombre: string;
  apellido: string;
  telefono: string;
  direccion: string;

  constructor(private papa: Papa, private _formBuilder: FormBuilder, private campanaService: CampanaService) {

  }

  ngOnInit() {

    this.firstFormGroup = this._formBuilder.group({
      separator: ['', Validators.required]
    });
    this.secondFormGroup = this._formBuilder.group({
      file: ['', Validators.required]
    });
    this.anio = new Date().getFullYear();
  }


  openFile(event) {
    //obtener file
    let input = event.target;
    //recorrer file y cargarlo
    for (var index = 0; index < input.files.length; index++) {
      let reader = new FileReader();
      reader.onload = () => {
        //  'data' esta el con tenido dela archivo
        var data = reader.result;
        this.strFile = data;
        //obtener encabezado
        this.parseo(data);
      }
      //para leer contenido del file
      reader.readAsText(input.files[index]);
    };
  }

  parseo(data) {
    let csvData = data;
    let options = {
      delimiter: this.firstFormGroup.value.separator,
      header: true,
      complete: (results) => {
        console.log('Parsed: ', results);
        let errors = results.errors;
        this.fields = results.meta.fields;
        this.captureErrorsCancel(errors,this.fields);
        this.dataFile = results.data;
      }
    };
    this.papa.parse(csvData, options);
  }

  save(form: NgForm) {
    //valid form
    if (form.invalid) {
      Swal.fire({
        text: 'Hay campos que faltan por completar',
        icon: 'warning',
        confirmButtonColor: '#073642',
      })
      return;
    }
    //obtener nombres de campos para almacenar
    let data = Object.values(form.value);
    //valid duplicates
    if (this.fieldsDuplicate(data)) {
      return
    }
    //editar nombre de propiedades(columnas) para la carga
    this.strFile = this.strFile.replace(form.value.nombre, "nombre");
    this.strFile = this.strFile.replace(form.value.apellido, "apellido");
    this.strFile = this.strFile.replace(form.value.telefono, "telefono");
    this.strFile = this.strFile.replace(form.value.direccion, "direccion");
    //dar formato json a strFile(archivo plano)
    this.parseo(this.strFile)

    //consultar servicio que trae el último código de campaña para adicionarlo a la información y realizae carga.
    this.campanaService.getLatestCampana().subscribe(resp => {
      if (resp[0].codigo) {
        //seleccionar columnas a cargar
        let cont = 0;
        this.dataFile.map(item => {
          let dataSave: ClienteCrm = { nombre: item.nombre, apellido: item.apellido, telefono: item.telefono, direccion: item.direccion, codigoCampana: resp[0].codigo };
          this.campanaService.saveClienteCrm(dataSave).subscribe(
            resp => {
              //hacer algo
            }, error => {
              console.log(<any>error)
              Swal.fire({
                text: error.error.message,
                icon: 'error'
              })
            }
          )
          console.log(dataSave)
        });
      }
    },
      error => {
        console.log(<any>error)
        Swal.fire({
          title: 'Error de conexión',
          icon: 'error',
          text: error.message,
          confirmButtonColor: '#073642',
        })
      });
    form.resetForm();
    this.reset();

  }

  fieldsDuplicate(data): boolean {
    var repetidos = [];
    var temporal = [];
    data.forEach((value, index) => {
      //Copiado de elemento
      temporal = Object.assign([], data);
      temporal.splice(index, 1); //Se elimina el elemento q se compara
      /**
       * Se busca en temporal el elemento, y en repetido para 
       * ver si esta ingresado al array. indexOf retorna
       * -1 si el elemento no se encuetra
       **/
      if (temporal.indexOf(value) != -1 && repetidos.indexOf(value) == -1) repetidos.push(value);
    });
    if (repetidos.length > 0) {
      Swal.fire({
        text: 'Hay campos duplicados: ' + repetidos,
        icon: 'warning',
        confirmButtonColor: '#073642',
      })
      return true;
    }
  }

  captureErrorsCancel(errors,fields){
    if(fields.length<=1){
      Swal.fire({
        title: 'Error',
        text: 'No concuerda el formato separador con el archivo',
        icon: 'error',
        confirmButtonColor: '#073642',
      })
      this.reset();
      return
    }
    if(errors.length>0){
      if(errors[0].code==='TooManyFields'){
        Swal.fire({
          title: 'Error',
          text: 'error en el encabezado',
          icon: 'error',
          confirmButtonColor: '#073642',
        })
      }else{
      Swal.fire({
        title: 'Error',
        text: 'error en archivo línea:'+parseInt(errors[0].row+2),
        icon: 'error',
        confirmButtonColor: '#073642',
      })
    }
      this.reset();
      return
    }

  }

  reset() {
    this.fields = [];
    this.stepper.reset();
  }

}
