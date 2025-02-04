function makeAggregationSelectMenu(){
  const aggregations = ['size', 'count', 'nunique', 'sum', 'mean', 'median', 'max', 'min', 'std', 'var']

  let agg_sel = document.createElement("select");
  for (const agg of aggregations) {
    let agg_opt = document.createElement("option");
    agg_opt.value = agg;
    agg_opt.text = agg;
    agg_sel.appendChild(agg_opt);
  }
  return agg_sel;
}

function updateAggregationsList(agg_list, model){
  let agg_cols = [];
  for (const child of agg_list.children) {
    let col = child.querySelector("label").innerText;
    let agg_type = child.querySelector("select").value;
    agg_cols.push([col, agg_type])
  }
  model.set("agg_columns", [] ); // reset agg columns to force serialization
  model.set("agg_columns", agg_cols);
  model.save_changes();
}

function handleGroupingListDrop(e, model){
  e.preventDefault();
  let col = e.dataTransfer.getData("text/plain")
  let p = document.createElement("p");
  p.innerText = col;
  p.style = "margin-left: 5px;"
  e.target.appendChild(p);
  
  let grp_columns = model.get("grouping_columns");
  grp_columns.push(col)
  console.log(grp_columns) 
  model.set("grouping_columns", [] ); // reset grouping columns to force serialization
  model.set("grouping_columns", grp_columns );
  model.save_changes();  
  console.log("item dropped");
}
    
function handleAggListDrop(e, model){
  e.preventDefault();
  let col = e.dataTransfer.getData("text/plain")
  let lbl = document.createElement("label");
  lbl.innerText = col;
  lbl.style = "margin: 0 5px;"

  let agg_sel = makeAggregationSelectMenu();
  agg_sel.addEventListener("change", (ev) => {
      ev.preventDefault();
      let agg_list = ev.target.parentElement.parentElement;
      updateAggregationsList(agg_list, model);
  });
          
  let p = document.createElement("p");
  p.appendChild(lbl);
  p.appendChild(agg_sel);
  
  let a = document.createElement("a");
  a.innerHTML = "<sup>x</sup>";
  a.className = "agg-tt";
  a.style = "margin-left: 5px;"
  a.href = "";
  a.addEventListener("click", (e) => {
      e.preventDefault();
      let agg_item = e.currentTarget.parentElement;
      let agg_list = agg_item.parentElement;
      agg_item.remove();
      updateAggregationsList(agg_list, model);
  });
  p.appendChild(a);  
  e.target.appendChild(p);

  let agg_cols = model.get("agg_columns");
  agg_cols.push([col, agg_sel.value]);
  model.set("agg_columns", [] ); // reset agg columns to force serialization
  model.set("agg_columns", agg_cols);
  model.save_changes();
  console.log(agg_cols);
  console.log("item dropped");      
}
    
function render({ model, el }) {
  let col_select_ui = document.createElement("div");
  col_select_ui.id = "col_select_ui"
  col_select_ui.style = "display: flex; width: 100%; margin-right: 20px;"
  col_select_ui.innerHTML = `
    <style>.agg-tt {visibility: hidden;}
           p:hover > .agg-tt {visibility: visible;}
    </style>
    <div id="display_list" style="flex: 1;"></div>
    <div id="grouping_col" style="display: flex; flex-direction: column; flex: 1; padding-top: 5px;">
      <div style="flex: 1; text-align: right;">
        <span>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
            <path fill="#616161" d="M16 11h-1V3c0-1.1-.9-2-2-2h-2c-1.1 0-2 .9-2 2v8H8c-2.76 0-5 2.24-5 5v7h18v-7c0-2.76-2.24-5-5-5m3 10h-2v-3c0-.55-.45-1-1-1s-1 .45-1 1v3h-2v-3c0-.55-.45-1-1-1s-1 .45-1 1v3H9v-3c0-.55-.45-1-1-1s-1 .45-1 1v3H5v-5c0-1.65 1.35-3 3-3h8c1.65 0 3 1.35 3 3z" class="jp-icon3"/>
          </svg>
          <a id="pivexp_grp_clear" href="" style="padding-right: 10px; text-decoration: underline;">clear</a>
        </span>
      </div>
      <div id="grouping_list_cont" style="flex: 9; border: 2px solid #e0e0e0; display: flex; flex-direction: column;">
        <h5 style="margin: 10px; color: red;">grouping</h5>
        <div id="grouping_list" droppable="true" style="flex: 1;"></div>
      </div>
      <div id="agg_list_cont" style="flex: 10; border: 2px solid #e0e0e0; display: flex; flex-direction: column;">
        <h5 style="margin: 10px; color: red;">aggregations</h5>
        <div id="agg_list" droppable="true" style="flex: 1;"></div>        
      </div>
    </div>
  `;
  
  let display_list = col_select_ui.querySelector("#display_list");
  
  let grouping_list = col_select_ui.querySelector("#grouping_list");
  grouping_list.addEventListener("drop", (e) => {
      handleGroupingListDrop(e, model)
  });
  grouping_list.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
  }); 
  
  let agg_list = col_select_ui.querySelector("#agg_list");
  agg_list.addEventListener("drop", (e) => {
      handleAggListDrop(e, model)
  });
  agg_list.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
  }); 

  let grp_clear_link = col_select_ui.querySelector("#pivexp_grp_clear");
  grp_clear_link.addEventListener("click", (e) => {
      e.preventDefault();
      grouping_list.replaceChildren();
      agg_list.replaceChildren();
      model.set("grouping_columns", [] );
      model.set("agg_columns", [] );
      model.save_changes();
  });
  
  let gcols = model.get("columns");
  
  for (const col of gcols) {
      let cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = "checked";
      cb.name = col;

      cb.addEventListener("click", (e) => {
          console.log(e.target.value)
          let disp_columns = model.get("display_columns");
          disp_columns.push(e.target.name)
          console.log(disp_columns) 
          model.set("display_columns", [] ); // reset display columns to force serialization
          model.set("display_columns", disp_columns );
          model.save_changes();
      });
  
      let p = document.createElement("p");
      
      let lbl = document.createElement("label");
      lbl.innerHTML = col;
      lbl.id = "col_lbl_" + col;
      lbl.draggable = "true";
      lbl.addEventListener("dragstart", (e) => {
          console.log("drag start");
          e.dataTransfer.setData("text/plain", e.target.innerText)
      });
      
      p.appendChild(cb);
      p.appendChild(lbl);
      display_list.appendChild(p);
  }

  el.appendChild(col_select_ui);
}
export default { render };
